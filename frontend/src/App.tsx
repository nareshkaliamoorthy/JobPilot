// frontend/src/App.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
    const [theme, setTheme] = useState("dark");

    const [resume, setResume] = useState<File | null>(null);
    const [pdf, setPdf] = useState<File | null>(null);

    const [keywords, setKeywords] = useState<string[]>([]);
    const [blockedKeywords, setBlockedKeywords] = useState<string[]>([]);

    const [newKeyword, setNewKeyword] = useState("");
    const [newBlocked, setNewBlocked] = useState("");

    const [loading, setLoading] = useState(false);

    const [jobs, setJobs] = useState<any[]>([]);

    const [summary, setSummary] = useState({
        total_jobs: 0,
        applied: 0,
        rejected: 0,
        blocked: 0,
        low_match: 0,
        success_rate: 0,
    });

    // ==========================================
    // Load Settings
    // ==========================================
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await axios.get(
                "http://127.0.0.1:8000/api/settings"
            );

            setKeywords(res.data.keywords || []);
            setBlockedKeywords(
                res.data.blocked_keywords || []
            );
            setTheme(res.data.theme || "dark");
        } catch {
            console.log("Failed to load settings");
        }
    };

    // ==========================================
    // Save Settings
    // ==========================================
    const saveSettings = async () => {
        try {
            const fd = new FormData();

            fd.append(
                "keywords",
                JSON.stringify(keywords)
            );

            fd.append(
                "blocked_keywords",
                JSON.stringify(blockedKeywords)
            );

            fd.append("theme", theme);

            await axios.post(
                "http://127.0.0.1:8000/api/settings",
                fd
            );

            alert("Settings Saved");
        } catch {
            alert("Failed to save");
        }
    };

    // ==========================================
    // Auto Apply
    // ==========================================
    const run = async () => {
        if (!resume || !pdf) {
            alert(
                "Upload Resume and PDF Jobs first"
            );
            return;
        }

        try {
            setLoading(true);

            const fd = new FormData();

            fd.append("resume", resume);
            fd.append("job_pdf", pdf);

            fd.append(
                "keywords",
                JSON.stringify(keywords)
            );

            fd.append(
                "blocked_keywords",
                JSON.stringify(blockedKeywords)
            );

            const res = await axios.post(
                "http://127.0.0.1:8000/api/auto-apply",
                fd
            );

            const updated =
                res.data.jobs.map((j: any) => ({
                    ...j,
                    uiStatus:
                        j.status === "Email Sent"
                            ? "APPLIED"
                            : "REJECTED",
                })) || [];

            setJobs(updated);

            setSummary(res.data.summary);
        } catch {
            alert("Failed to run");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // Theme
    // ==========================================
    const dark = theme === "dark";

    const bg = dark ? "#0f172a" : "#f8fafc";
    const card = dark ? "#111827" : "#ffffff";
    const text = dark ? "#ffffff" : "#111827";
    const muted = dark ? "#94a3b8" : "#475569";
    const border = dark
        ? "1px solid #334155"
        : "1px solid #e2e8f0";

    // ==========================================
    // Helpers
    // ==========================================
    const addKeyword = () => {
        if (
            newKeyword.trim() &&
            !keywords.includes(newKeyword.trim())
        ) {
            setKeywords([
                ...keywords,
                newKeyword.trim(),
            ]);
            setNewKeyword("");
        }
    };

    const addBlocked = () => {
        if (
            newBlocked.trim() &&
            !blockedKeywords.includes(
                newBlocked.trim()
            )
        ) {
            setBlockedKeywords([
                ...blockedKeywords,
                newBlocked.trim(),
            ]);
            setNewBlocked("");
        }
    };

    const removeKeyword = (
        index: number
    ) => {
        setKeywords(
            keywords.filter(
                (_, i) => i !== index
            )
        );
    };

    const removeBlocked = (
        index: number
    ) => {
        setBlockedKeywords(
            blockedKeywords.filter(
                (_, i) => i !== index
            )
        );
    };

    const badge = (status: string) => {
        const ok =
            status === "APPLIED";

        return (
            <span
                style={{
                    background: ok
                        ? "#16a34a"
                        : "#dc2626",
                    color: "white",
                    padding:
                        "6px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                }}
            >
                {status}
            </span>
        );
    };

    // ==========================================
    // UI
    // ==========================================
    return (
        <div
            style={{
                minHeight: "100vh",
                background: bg,
                color: text,
                padding: 24,
                fontFamily:
                    "Arial, sans-serif",
            }}
        >
            {/* Loader */}
            {loading && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background:
                            "rgba(0,0,0,.75)",
                        display: "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        zIndex: 9999,
                        color: "white",
                        fontSize: 24,
                        fontWeight: 700,
                    }}
                >
                    Processing...
                </div>
            )}

            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                }}
            >
                <h1
                    style={{
                        margin: 0,
                    }}
                >
                    🚀 JobPilot
                </h1>

                <button
                    onClick={() =>
                        setTheme(
                            dark
                                ? "light"
                                : "dark"
                        )
                    }
                    style={btn}
                >
                    {dark
                        ? "Light Theme"
                        : "Dark Theme"}
                </button>
            </div>

            {/* Upload */}
            <div
                style={{
                    ...panel(card),
                    ...borderBox(border),
                }}
            >
                <h3>
                    Upload Files
                </h3>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "1fr 1fr",
                        gap: 16,
                    }}
                >
                    <div>
                        <label>
                            Resume Upload
                        </label>
                        <br />
                        <input
                            type="file"
                            onChange={(e) =>
                                setResume(
                                    e.target
                                        .files?.[0] ||
                                    null
                                )
                            }
                        />
                    </div>

                    <div>
                        <label>
                            PDF Jobs
                        </label>
                        <br />
                        <input
                            type="file"
                            onChange={(e) =>
                                setPdf(
                                    e.target
                                        .files?.[0] ||
                                    null
                                )
                            }
                        />
                    </div>
                </div>

                {/* Keywords */}
                <h3
                    style={{
                        marginTop: 24,
                    }}
                >
                    Keywords
                </h3>

                <TagSection
                    items={keywords}
                    remove={
                        removeKeyword
                    }
                    color="#2563eb"
                />

                <div
                    style={{
                        marginTop: 10,
                    }}
                >
                    <input
                        value={newKeyword}
                        onChange={(e) =>
                            setNewKeyword(
                                e.target.value
                            )
                        }
                        placeholder="Add keyword"
                        style={input}
                    />

                    <button
                        onClick={
                            addKeyword
                        }
                        style={smallBtn}
                    >
                        +
                    </button>
                </div>

                {/* Blocked */}
                <h3
                    style={{
                        marginTop: 24,
                    }}
                >
                    Blocked Keywords
                </h3>

                <TagSection
                    items={
                        blockedKeywords
                    }
                    remove={
                        removeBlocked
                    }
                    color="#dc2626"
                />

                <div
                    style={{
                        marginTop: 10,
                    }}
                >
                    <input
                        value={
                            newBlocked
                        }
                        onChange={(e) =>
                            setNewBlocked(
                                e.target.value
                            )
                        }
                        placeholder="Add blocked keyword"
                        style={input}
                    />

                    <button
                        onClick={
                            addBlocked
                        }
                        style={smallBtn}
                    >
                        +
                    </button>
                </div>

                <div
                    style={{
                        marginTop: 24,
                        display: "flex",
                        gap: 10,
                    }}
                >
                    <button
                        onClick={run}
                        style={btn}
                    >
                        Auto Apply
                    </button>

                    <button
                        onClick={
                            saveSettings
                        }
                        style={btn}
                    >
                        Save Settings
                    </button>
                </div>
            </div>

            {/* KPI */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(6,1fr)",
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <KPI
                    title="Total"
                    value={
                        summary.total_jobs
                    }
                    bg={card}
                    text={text}
                />
                <KPI
                    title="Applied"
                    value={
                        summary.applied
                    }
                    bg={card}
                    text={text}
                />
                <KPI
                    title="Rejected"
                    value={
                        summary.rejected
                    }
                    bg={card}
                    text={text}
                />
                <KPI
                    title="Blocked"
                    value={
                        summary.blocked
                    }
                    bg={card}
                    text={text}
                />
                <KPI
                    title="Low Match"
                    value={
                        summary.low_match
                    }
                    bg={card}
                    text={text}
                />
                <KPI
                    title="Success %"
                    value={
                        summary.success_rate +
                        "%"
                    }
                    bg={card}
                    text={text}
                />
            </div>

            {/* Table */}
            <div
                style={{
                    ...panel(card),
                    ...borderBox(border),
                }}
            >
                <h3>
                    Application Results
                </h3>

                <div
                    style={{
                        overflowX:
                            "auto",
                    }}
                >
                    <table
                        style={{
                            width: "100%",
                            borderCollapse:
                                "collapse",
                            tableLayout:
                                "fixed",
                        }}
                    >
                        <thead>
                            <tr>
                                {[
                                    "Company",
                                    "Role",
                                    "Exp",
                                    "Location",
                                    "Match %",
                                    "Matched Terms",
                                    "Status",
                                    "Reason",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            ...th(
                                                text,
                                                border
                                            ),
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {jobs.map(
                                (
                                    j,
                                    i
                                ) => (
                                    <tr
                                        key={
                                            i
                                        }
                                    >
                                        <Cell
                                            value={
                                                j.company
                                            }
                                            text={
                                                text
                                            }
                                            border={
                                                border
                                            }
                                        />
                                        <Cell
                                            value={
                                                j.role
                                            }
                                            text={
                                                text
                                            }
                                            border={
                                                border
                                            }
                                        />
                                        <Cell
                                            value={
                                                j.experience
                                            }
                                            text={
                                                text
                                            }
                                            border={
                                                border
                                            }
                                        />
                                        <Cell
                                            value={
                                                j.location
                                            }
                                            text={
                                                text
                                            }
                                            border={
                                                border
                                            }
                                        />
                                        <Cell
                                            value={
                                                j.match_percent +
                                                "%"
                                            }
                                            text={
                                                text
                                            }
                                            border={
                                                border
                                            }
                                        />
                                        <Cell
                                            value={(
                                                j.matched_terms ||
                                                []
                                            ).join(
                                                ", "
                                            )}
                                            text={
                                                text
                                            }
                                            border={
                                                border
                                            }
                                        />
                                        <td
                                            style={td(
                                                text,
                                                border
                                            )}
                                        >
                                            {badge(
                                                j.uiStatus
                                            )}
                                        </td>
                                        <Cell
                                            value={
                                                j.error_reason
                                            }
                                            text={
                                                text
                                            }
                                            border={
                                                border
                                            }
                                        />
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ====================================== */

function KPI({
    title,
    value,
    bg,
    text,
}: any) {
    return (
        <div
            style={{
                background: bg,
                color: text,
                padding: 16,
                borderRadius: 12,
                textAlign:
                    "center",
            }}
        >
            <div>
                {title}
            </div>

            <div
                style={{
                    fontSize: 24,
                    fontWeight: 700,
                    marginTop: 6,
                }}
            >
                {value}
            </div>
        </div>
    );
}

function TagSection({
    items,
    remove,
    color,
}: any) {
    return (
        <div
            style={{
                display: "flex",
                gap: 8,
                flexWrap:
                    "wrap",
            }}
        >
            {items.map(
                (
                    item: string,
                    i: number
                ) => (
                    <span
                        key={i}
                        style={{
                            background:
                                color,
                            color:
                                "white",
                            padding:
                                "6px 10px",
                            borderRadius: 20,
                            fontSize: 13,
                        }}
                    >
                        {item}

                        <button
                            onClick={() =>
                                remove(
                                    i
                                )
                            }
                            style={{
                                marginLeft: 8,
                                border:
                                    "none",
                                background:
                                    "transparent",
                                color:
                                    "white",
                                cursor:
                                    "pointer",
                            }}
                        >
                            x
                        </button>
                    </span>
                )
            )}
        </div>
    );
}

function Cell({
    value,
    text,
    border,
}: any) {
    return (
        <td
            style={td(
                text,
                border
            )}
        >
            {value}
        </td>
    );
}

/* ====================================== */

const btn = {
    padding:
        "10px 16px",
    border: "none",
    borderRadius: 8,
    background:
        "#2563eb",
    color: "white",
    cursor: "pointer",
};

const smallBtn = {
    marginLeft: 8,
    padding:
        "8px 12px",
    border: "none",
    borderRadius: 8,
    background:
        "#16a34a",
    color: "white",
};

const input = {
    padding: 8,
    borderRadius: 8,
    border:
        "1px solid #cbd5e1",
};

const panel = (
    bg: string
) => ({
    background: bg,
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
});

const borderBox = (
    border: string
) => ({
    border,
});

const th = (
    text: string,
    border: string
) => ({
    padding: 12,
    textAlign:
        "center" as const,
    borderBottom:
        border,
    color: text,
});

const td = (
    text: string,
    border: string
) => ({
    padding: 12,
    textAlign:
        "center" as const,
    borderBottom:
        border,
    color: text,
    wordBreak:
        "break-word" as const,
});