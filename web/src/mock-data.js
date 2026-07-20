/** Static mock data mirroring Designer.png — replace with HM APIs later. */

export const kpis = {
  healthScore: 78,
  healthLabel: "Good",
  totalComponents: 1248,
  problems: 23,
  problemsPct: 1.84,
  warnings: 47,
  warningsPct: 3.76,
  info: 128,
  infoPct: 10.26,
  sitesImpacted: 8,
  sitesTotal: 23,
};

export const componentsByType = {
  labels: ["Connectors", "Relays", "Cores", "DataSources"],
  values: [782, 236, 168, 62],
  colors: ["#2563eb", "#7c3aed", "#0ea5e9", "#94a3b8"],
};

export const issuesBySeverity = {
  labels: ["High", "Medium", "Low"],
  values: [23, 47, 128],
  colors: ["#ef4444", "#eab308", "#3b82f6"],
};

export const criticalIssues = [
  {
    time: "10:12:05",
    site: "Alcala",
    component: "OPC-UA-01",
    type: "COMM_ERROR",
    message: "Connection lost to endpoint",
  },
  {
    time: "10:08:41",
    site: "Bitterfeld",
    component: "Core-A",
    type: "STATE_ERROR",
    message: "Object disabled unexpectedly",
  },
  {
    time: "09:55:12",
    site: "Casablanca",
    component: "DS-Batch",
    type: "Performance",
    message: "Disk usage > 90%",
  },
  {
    time: "09:41:03",
    site: "Grenzach",
    component: "Relay-02",
    type: "COMM_ERROR",
    message: "Heartbeat timeout",
  },
];

export const siteSummary = [
  {
    site: "Alcala",
    score: 72,
    total: 186,
    problems: 4,
    warnings: 9,
    info: 18,
    trend: [70, 71, 69, 72, 74, 73, 72],
  },
  {
    site: "Bitterfeld",
    score: 81,
    total: 142,
    problems: 2,
    warnings: 5,
    info: 11,
    trend: [78, 79, 80, 80, 81, 82, 81],
  },
  {
    site: "Casablanca",
    score: 64,
    total: 98,
    problems: 6,
    warnings: 8,
    info: 14,
    trend: [68, 66, 65, 64, 63, 65, 64],
  },
  {
    site: "Grenzach",
    score: 88,
    total: 210,
    problems: 1,
    warnings: 3,
    info: 9,
    trend: [85, 86, 87, 88, 88, 89, 88],
  },
  {
    site: "Bergkamen",
    score: 76,
    total: 155,
    problems: 3,
    warnings: 7,
    info: 16,
    trend: [74, 75, 75, 76, 77, 76, 76],
  },
];

export const issuesOverTime = {
  labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
  problems: [18, 20, 22, 25, 24, 23, 23],
  warnings: [40, 42, 44, 48, 46, 47, 47],
  info: [110, 115, 120, 125, 130, 128, 128],
};

export const topIssueTypes = {
  labels: [
    "Communication",
    "Performance",
    "Certificate",
    "State Error",
    "Configuration",
    "Other",
  ],
  values: [23, 18, 12, 11, 9, 8],
};

export const recentAlerts = [
  {
    time: "10:14:22",
    severity: "High",
    site: "Alcala",
    component: "OPC-UA-01",
    message: "COMM_ERROR — link down",
    status: "Open",
    duration: "12m",
    ack: "—",
  },
  {
    time: "10:02:08",
    severity: "Medium",
    site: "Bitterfeld",
    component: "Core-A",
    message: "CPU load elevated",
    status: "Open",
    duration: "28m",
    ack: "—",
  },
  {
    time: "09:48:55",
    severity: "Low",
    site: "Grenzach",
    component: "DS-Lab",
    message: "Neutral state reported",
    status: "Open",
    duration: "41m",
    ack: "j.smith",
  },
  {
    time: "09:30:11",
    severity: "High",
    site: "Casablanca",
    component: "Relay-01",
    message: "STATE_ERROR",
    status: "Open",
    duration: "1h 02m",
    ack: "—",
  },
  {
    time: "09:12:40",
    severity: "Medium",
    site: "Bergkamen",
    component: "Connector-7",
    message: "Certificate expires in 14d",
    status: "Open",
    duration: "1h 20m",
    ack: "—",
  },
];

export const alertsBySeverity = {
  labels: ["High", "Medium", "Low"],
  values: [23, 31, 16],
  colors: ["#ef4444", "#eab308", "#3b82f6"],
  total: 70,
};
