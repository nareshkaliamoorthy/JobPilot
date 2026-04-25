// src/App.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
    /* =========================
       STATES
    ========================= */
    const [activeTab, setActiveTab] = useState("dashboard");
    const [theme, setTheme] = useState("dark");

    const [resume, setResume] = useState<File | null>(null);

    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [summary, setSummary] = useState({
        total_jobs: 0,
        applied: 0,
        rejected: 0,
        blocked: 0,
        low_match: 0,
        success_rate: 0,
    });

    /* =========================
       SETTINGS
    ========================= */
    const [keywords, setKeywords] = useState<string[]>([]);
    const [blockedKeywords, setBlockedKeywords] = useState<string[]>([]);

    const [newKeyword, setNewKeyword] = useState("");
    const [newBlocked, setNewBlocked] = useState("");

    /* =========================
       WHATSAPP
    ========================= */
    const [waConnected, setWaConnected] = useState(false);
    const [waLoading, setWaLoading] = useState(false);

    const [contactName, setContactName] = useState("Naresh K");
    const [pollInterval, setPollInterval] = useState(60);

    const [watching, setWatching] = useState(false);
    const [watchStatus, setWatchStatus] = useState("");

    /* =========================
       THEME
    ========================= */
    const dark = theme === "dark";

    const bg = dark ? "#0f172a" : "#f8fafc";
    const card = dark ? "#111827" : "#ffffff";
    const text = dark ? "#ffffff" : "#111827";
    const border = dark ? "1px solid #334155" : "1px solid #e2e8f0";

    /* =========================
       LOAD
    ========================= */
    useEffect(() => {
        loadSettings();
        checkWaStatus();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            refreshDashboard();
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    const loadSettings = async () => {
        try {
            const res = await axios.get("http://127.0.0.1:8000/api/settings");

            setKeywords(res.data.keywords || []);
            setBlockedKeywords(res.data.blocked_keywords || []);
            setTheme(res.data.theme || "dark");
        } catch { }
    };

    /* =========================
       SETTINGS SAVE
    ========================= */
    const saveSettings = async () => {
        try {
            const fd = new FormData();

            fd.append("keywords", JSON.stringify(keywords));
            fd.append(
                "blocked_keywords",
                JSON.stringify(blockedKeywords)
            );
            fd.append("theme", theme);

            await axios.post(
                "http://127.0.0.1:8000/api/settings",
                fd
            );

            alert("Settings saved");
        } catch {
            alert("Failed to save");
        }
    };

    /* =========================
       RESUME UPLOAD ONLY
    ========================= */
    const uploadResume = async () => {
        if (!resume) {
            alert("Choose resume");
            return;
        }

        try {
            setLoading(true);

            const fd = new FormData();
            fd.append("resume", resume);

            await axios.post(
                "http://127.0.0.1:8000/api/upload-resume",
                fd
            );

            alert("Resume uploaded");
        } catch {
            alert("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       REFRESH DASHBOARD
    ========================= */
    const refreshDashboard = async () => {
        try {
            const res = await axios.get(
                "http://127.0.0.1:8000/api/dashboard"
            );

            setJobs(res.data.jobs || []);
            setSummary(res.data.summary || {});
        } catch { }
    };

    /* =========================
       WHATSAPP
    ========================= */
    const checkWaStatus = async () => {
        try {
            const res = await axios.get(
                "http://127.0.0.1:8000/api/whatsapp/status"
            );

            setWaConnected(res.data.connected);
        } catch { }
    };

    const pollLogin = () => {
        const timer = setInterval(async () => {
            try {
                const res = await axios.get(
                    "http://127.0.0.1:8000/api/whatsapp/wait-login"
                );

                if (res.data.connected) {
                    clearInterval(timer);
                    setWaConnected(true);
                    alert("Connected");
                }
            } catch { }
        }, 3000);
    };

    const connectWhatsApp = async () => {
        try {
            setWaLoading(true);

            const res = await axios.post(
                "http://127.0.0.1:8000/api/whatsapp/connect"
            );

            if (!res.data.success) {
                alert(res.data.error);
                return;
            }

            alert(
                "WhatsApp browser opened. Scan QR in browser window."
            );

            pollLogin();
        } catch {
            alert("Backend not reachable");
        } finally {
            setWaLoading(false);
        }
    };

    const disconnectWhatsApp = async () => {
        try {
            await axios.post(
                "http://127.0.0.1:8000/api/whatsapp/disconnect"
            );

            setWaConnected(false);
            setWatching(false);
        } catch { }
    };

    const startWatcher = async () => {
        try {
            const fd = new FormData();

            fd.append("contact_name", contactName);
            fd.append("interval", String(pollInterval));

            const res = await axios.post(
                "http://127.0.0.1:8000/api/whatsapp/start-watch",
                fd
            );

            setWatching(true);
            setWatchStatus(res.data.message);
        } catch {
            alert("Failed to start watcher");
        }
    };

    const stopWatcher = async () => {
        try {
            const res = await axios.post(
                "http://127.0.0.1:8000/api/whatsapp/stop-watch"
            );

            setWatching(false);
            setWatchStatus(res.data.message);
        } catch { }
    };

    /* =========================
       KEYWORD HELPERS
    ========================= */
    const addKeyword = () => {
        if (!newKeyword.trim()) return;

        setKeywords([...keywords, newKeyword.trim()]);
        setNewKeyword("");
    };

    const addBlocked = () => {
        if (!newBlocked.trim()) return;

        setBlockedKeywords([
            ...blockedKeywords,
            newBlocked.trim(),
        ]);

        setNewBlocked("");
    };

    const removeKeyword = (i: number) =>
        setKeywords(
            keywords.filter((_, x) => x !== i)
        );

    const removeBlocked = (i: number) =>
        setBlockedKeywords(
            blockedKeywords.filter((_, x) => x !== i)
        );

    /* =========================
       BADGE
    ========================= */
    const badge = (status: string) => {
        const green = status === "APPLIED";

        return (
            <span
                style={{
                    background: green
                        ? "#16a34a"
                        : "#dc2626",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: 18,
                    fontSize: 12,
                    fontWeight: 700,
                }}
            >
                {status}
            </span>
        );
    };

    /* =========================
       UI
    ========================= */
    return (
        <div
            style={{
                minHeight: "100vh",
                background: bg,
                color: text,
                padding: 24,
                fontFamily: "Arial",
            }}
        >
            {loading && (
                <div style={overlay}>
                    Processing...
                </div>
            )}

            {/* HEADER */}
            <div style={header}>
                <h1></h1>

                <div style={row}>
                    <button
                        style={
                            activeTab === "dashboard"
                                ? activeBtn
                                : btn
                        }
                        onClick={() =>
                            setActiveTab("dashboard")
                        }
                    >
                        Dashboard
                    </button>

                    <button
                        style={
                            activeTab === "settings"
                                ? activeBtn
                                : btn
                        }
                        onClick={() =>
                            setActiveTab("settings")
                        }
                    >
                        Settings
                    </button>

                    <button
                        style={btn}
                        onClick={() =>
                            setTheme(
                                dark
                                    ? "light"
                                    : "dark"
                            )
                        }
                    >
                        {dark
                            ? "Light"
                            : "Dark"}
                    </button>
                </div>
            </div>

            {/* DASHBOARD */}
            {activeTab ===
                "dashboard" && (
                    <>
                        <div
                            style={{
                                marginBottom: 24,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <h1
                                    style={{
                                        margin: 0,
                                        fontSize: 30,
                                        fontWeight: 800,
                                    }}
                                >
                                    🚀 JobPilot Dashboard
                                </h1>

                                <p
                                    style={{
                                        marginTop: 6,
                                        opacity: 0.75,
                                    }}
                                >
                                    Live Monitoring Enabled ● Auto Refresh Active
                                </p>
                            </div>
                        </div>

                        {/* KPI */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: 16,
                                marginBottom: 24,
                            }}
                        >
                            {[
                                {
                                    label: "Total",
                                    value: summary.total_jobs,
                                    border: "#2563eb",
                                },
                                {
                                    label: "Applied",
                                    value: summary.applied,
                                    border: "#16a34a",
                                },
                                {
                                    label: "Rejected",
                                    value: summary.rejected,
                                    border: "#dc2626",
                                },
                                {
                                    label: "Blocked",
                                    value: summary.blocked,
                                    border: "#ef4444",
                                },
                                {
                                    label: "Low Match",
                                    value: summary.low_match,
                                    border: "#f59e0b",
                                },
                                {
                                    label: "Success %",
                                    value:
                                        summary.success_rate + "%",
                                    border: "#10b981",
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    style={{
                                        background: card,
                                        color: text,
                                        padding: 22,
                                        borderRadius: 14,
                                        borderLeft:
                                            `6px solid ${item.border}`,
                                        boxShadow:
                                            "0 10px 25px rgba(0,0,0,.12)",
                                        textAlign: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 14,
                                            opacity: 0.7,
                                            marginBottom: 10,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {item.label}
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 34,
                                            fontWeight: 800,
                                        }}
                                    >
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* TABLE */}
                        <div
                            style={{
                                ...panel(card),
                                border,
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
                                            "Terms",
                                            "Status",
                                            "Reason",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                style={th(
                                                    text
                                                )}
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
                                                key={i}
                                            >
                                                <Cell
                                                    text={
                                                        text
                                                    }
                                                    value={
                                                        j.company
                                                    }
                                                />
                                                <Cell
                                                    text={
                                                        text
                                                    }
                                                    value={
                                                        j.role
                                                    }
                                                />
                                                <Cell
                                                    text={
                                                        text
                                                    }
                                                    value={
                                                        j.experience
                                                    }
                                                />
                                                <Cell
                                                    text={
                                                        text
                                                    }
                                                    value={
                                                        j.location
                                                    }
                                                />
                                                <Cell
                                                    text={
                                                        text
                                                    }
                                                    value={
                                                        j.match_percent +
                                                        "%"
                                                    }
                                                />
                                                <Cell
                                                    text={
                                                        text
                                                    }
                                                    value={(
                                                        j.matched_terms ||
                                                        []
                                                    ).join(
                                                        ", "
                                                    )}
                                                />
                                                <td
                                                    style={td(
                                                        text
                                                    )}
                                                >
                                                    {badge(
                                                        j.status ===
                                                            "Email Sent"
                                                            ? "APPLIED"
                                                            : "REJECTED"
                                                    )}
                                                </td>
                                                <Cell
                                                    text={
                                                        text
                                                    }
                                                    value={
                                                        j.error_reason
                                                    }
                                                />
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

            {/* SETTINGS */}
            {activeTab ===
                "settings" && (
                    <div
                        style={panel(
                            card
                        )}
                    >
                        <h2>
                            ⚙️ Settings
                        </h2>

                        {/* Resume */}
                        <div
                            style={{
                                marginTop: 20,
                            }}
                        >
                            <h3>
                                Resume
                            </h3>

                            <input
                                type="file"
                                onChange={(e) =>
                                    setResume(
                                        e.target.files?.[0] ||
                                        null
                                    )
                                }
                            />

                            <button
                                style={{
                                    ...btn,
                                    marginLeft: 12,
                                }}
                                onClick={
                                    uploadResume
                                }
                            >
                                Upload
                            </button>
                        </div>

                        {/* WhatsApp */}
                        <div
                            style={{
                                marginTop: 30,
                            }}
                        >
                            <h3>
                                WhatsApp
                            </h3>

                            {waConnected ? (
                                <>
                                    <p>
                                        ✅
                                        Connected
                                    </p>

                                    <button
                                        style={
                                            btn
                                        }
                                        onClick={
                                            disconnectWhatsApp
                                        }
                                    >
                                        Disconnect
                                    </button>
                                </>
                            ) : (
                                <button
                                    style={
                                        btn
                                    }
                                    onClick={
                                        connectWhatsApp
                                    }
                                >
                                    {waLoading
                                        ? "Starting..."
                                        : "Connect WhatsApp"}
                                </button>
                            )}

                            <div
                                style={{
                                    marginTop: 16,
                                }}
                            >
                                <input
                                    style={
                                        inputFull
                                    }
                                    value={
                                        contactName
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setContactName(
                                            e.target
                                                .value
                                        )
                                    }
                                    placeholder="Chat Name"
                                />

                                <input
                                    type="number"
                                    style={
                                        inputFull
                                    }
                                    value={
                                        pollInterval
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setPollInterval(
                                            Number(
                                                e.target
                                                    .value
                                            )
                                        )
                                    }
                                    placeholder="Polling Seconds"
                                />

                                <div
                                    style={
                                        row
                                    }
                                >
                                    <button
                                        style={
                                            btn
                                        }
                                        onClick={
                                            startWatcher
                                        }
                                        disabled={
                                            !waConnected
                                        }
                                    >
                                        Start
                                        Watcher
                                    </button>

                                    <button
                                        style={{
                                            ...btn,
                                            background:
                                                "#dc2626",
                                        }}
                                        onClick={
                                            stopWatcher
                                        }
                                    >
                                        Stop
                                    </button>
                                </div>

                                <p
                                    style={{
                                        marginTop: 10,
                                    }}
                                >
                                    Status:
                                    {watching
                                        ? " 🟢 Running"
                                        : " 🔴 Stopped"}
                                </p>

                                <p>
                                    {
                                        watchStatus
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Keywords */}
                        <div
                            style={{
                                marginTop: 30,
                            }}
                        >
                            <h3>
                                Keywords
                            </h3>

                            <TagBox
                                items={
                                    keywords
                                }
                                remove={
                                    removeKeyword
                                }
                                color="#2563eb"
                            />

                            <input
                                style={
                                    input
                                }
                                value={
                                    newKeyword
                                }
                                onChange={(
                                    e
                                ) =>
                                    setNewKeyword(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder="Add keyword"
                            />

                            <button
                                style={
                                    smallBtn
                                }
                                onClick={
                                    addKeyword
                                }
                            >
                                +
                            </button>
                        </div>

                        {/* Blocked */}
                        <div
                            style={{
                                marginTop: 30,
                            }}
                        >
                            <h3>
                                Blocked
                                Keywords
                            </h3>

                            <TagBox
                                items={
                                    blockedKeywords
                                }
                                remove={
                                    removeBlocked
                                }
                                color="#dc2626"
                            />

                            <input
                                style={
                                    input
                                }
                                value={
                                    newBlocked
                                }
                                onChange={(
                                    e
                                ) =>
                                    setNewBlocked(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder="Add blocked"
                            />

                            <button
                                style={
                                    smallBtn
                                }
                                onClick={
                                    addBlocked
                                }
                            >
                                +
                            </button>
                        </div>

                        {/* Save */}
                        <div
                            style={{
                                marginTop: 30,
                            }}
                        >
                            <button
                                style={
                                    btn
                                }
                                onClick={
                                    saveSettings
                                }
                            >
                                Save
                                Settings
                            </button>
                        </div>
                    </div>
                )}
        </div>
    );
}

/* =========================
   REUSABLES
========================= */
function Cell({
    value,
    text,
}: any) {
    return (
        <td style={td(text)}>
            {value}
        </td>
    );
}

function TagBox({
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
                marginBottom: 12,
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
                            borderRadius: 18,
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

/* =========================
   STYLES
========================= */
const header = {
    display: "flex",
    justifyContent:
        "space-between",
    alignItems: "center",
    marginBottom: 20,
};

const row = {
    display: "flex",
    gap: 10,
};

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

const activeBtn = {
    ...btn,
    background:
        "#16a34a",
};

const smallBtn = {
    ...btn,
    padding:
        "8px 12px",
    marginLeft: 8,
};

const panel = (
    bg: string
) => ({
    background: bg,
    padding: 20,
    borderRadius: 14,
});

const input = {
    padding: 8,
    borderRadius: 8,
    border:
        "1px solid #cbd5e1",
};

const inputFull = {
    ...input,
    width: "100%",
    display: "block",
    marginBottom: 10,
};

const th = (
    text: string
) => ({
    padding: 12,
    color: text,
    textAlign:
        "center" as const,
    borderBottom:
        "1px solid #64748b",
});

const td = (
    text: string
) => ({
    padding: 12,
    color: text,
    textAlign:
        "center" as const,
    borderBottom:
        "1px solid #64748b",
    wordBreak:
        "break-word" as const,
});

const overlay = {
    position:
        "fixed" as const,
    inset: 0,
    background:
        "rgba(0,0,0,.75)",
    display: "flex",
    justifyContent:
        "center",
    alignItems:
        "center",
    color: "white",
    fontSize: 28,
    zIndex: 9999,
};

