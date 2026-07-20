/**
 * EAM Critical Objects — alert recipients.
 * Mock seeded from the EAM Critical Objects capture (path / type / emails).
 * Replace with live EAM source later; edits stay in-memory for this draft.
 */

export const EAM_SOURCE_LABEL =
  "EAM Critical Objects (capture) — in-memory edits, not saved to host yet";

function emails(...list) {
  return list.filter(Boolean);
}

/** Mutable working copy for the Configuration UI. */
export const eamCriticalObjects = [
  {
    id: "eam-1",
    path: "/System/Core",
    type: "Global Core",
    emails: emails(
      "victor.gonzalezmateos@bayer.com",
      "fadel.fawaz@bayer.com"
    ),
  },
  {
    id: "eam-2",
    path: "/System/Core/NA-US-ENTERPRISE-001",
    type: "Server",
    emails: emails(
      "satria.hagas.syahputra.ext@bayer.com",
      "fadel.fawaz@bayer.com"
    ),
  },
  {
    id: "eam-3",
    path: "/System/Core/_Global Operational Connectors/BYUS00875M1-WebAPI+OPC Server",
    type: "Global Connector",
    emails: emails("fadel.fawaz@bayer.com"),
  },
  {
    id: "eam-4",
    path: "/System/Core/_Global Operational Connectors/BYUS00876M1-WebAPI+OPC Server",
    type: "Global Connector",
    emails: emails(
      "victor.gonzalezmateos@bayer.com",
      "fadel.fawaz@bayer.com"
    ),
  },
  {
    id: "eam-5",
    path: "/System/Core/APAC-ID-CIM-P0-RELAY-001/APAC-ID-CIM-LOCALCORE-001",
    type: "Local Core",
    emails: emails(
      "satria.hagas.syahputra.ext@bayer.com",
      "fadel.fawaz@bayer.com"
    ),
  },
  {
    id: "eam-6",
    path: "/System/Core/APAC-ID-QID-P0-RELAY-001/APAC-ID-QID-LOCALCORE-001",
    type: "Local Core",
    emails: emails(
      "satria.hagas.syahputra.ext@bayer.com",
      "fadel.fawaz@bayer.com"
    ),
  },
  {
    id: "eam-7",
    path: "/System/Core/EMEA-DEU-BIT-P0-RELAY-001/EMEA-DEU-BIT-LOCALCORE-001",
    type: "Local Core",
    emails: emails("fadel.fawaz@bayer.com"),
  },
  {
    id: "eam-8",
    path: "/System/Core/EMEA-DEU-BIT-P0-RELAY-001/EMEA-DEU-BIT-LOCALCORE-001/BIT-CORE-001",
    type: "BIT Core",
    emails: emails(
      "satria.hagas.syahputra.ext@bayer.com",
      "fadel.fawaz@bayer.com",
      "victor.gonzalezmateos@bayer.com"
    ),
  },
  {
    id: "eam-9",
    path: "/System/Core/EMEA-DEU-GRZ-P0-RELAY-001/EMEA-DEU-GRZ-LOCALCORE-001",
    type: "Local Core",
    emails: emails(
      "victor.gonzalezmateos@bayer.com",
      "fadel.fawaz@bayer.com"
    ),
  },
  {
    id: "eam-10",
    path: "/System/Core/EMEA-DEU-GRZ-P0-RELAY-001/EMEA-DEU-GRZ-LOCALCORE-001/EMEA-DEU-GRZ-P0-BYGRZ452ICT",
    type: "Connector",
    emails: emails("fadel.fawaz@bayer.com"),
  },
  {
    id: "eam-11",
    path: "/System/Core/EMEA-ESP-ALC-P0-RELAY-001/EMEA-ESP-ALC-LOCALCORE-001",
    type: "Local Core",
    emails: emails(
      "satria.hagas.syahputra.ext@bayer.com",
      "fadel.fawaz@bayer.com",
      "victor.gonzalezmateos@bayer.com",
      "eam-alerts@bayer.com"
    ),
  },
  {
    id: "eam-12",
    path: "/System/Core/EMEA-MAR-CSA-P0-RELAY-001/EMEA-MAR-CSA-LOCALCORE-001",
    type: "Local Core",
    emails: emails("fadel.fawaz@bayer.com"),
  },
  {
    id: "eam-13",
    path: "/System/Core/EMEA-MAR-CSA-P0-RELAY-001/EMEA-MAR-CSA-P1-RELAY-001",
    type: "Connector",
    emails: emails("fadel.fawaz@bayer.com"),
  },
  {
    id: "eam-14",
    path: "/System/Core/EMEA-MAR-CSA-P0-RELAY-001/EMEA-MAR-CSA-P1-RELAY-001/EMEA-MAR-CSA-P2-VL2213-001",
    type: "Connector",
    emails: emails(
      "satria.hagas.syahputra.ext@bayer.com",
      "fadel.fawaz@bayer.com"
    ),
  },
  {
    id: "eam-15",
    path: "/System/Core/EMEA-MAR-CSA-P0-RELAY-001/EMEA-MAR-CSA-P1-RELAY-001/EMEA-MAR-CSA-P2-VL2214-001",
    type: "Connector",
    emails: emails("fadel.fawaz@bayer.com"),
  },
  {
    id: "eam-16",
    path: "/System/Core/EMEA-MAR-CSA-P0-RELAY-001/EMEA-MAR-CSA-P1-RELAY-001/EMEA-MAR-CSA-P2-VL2215-001",
    type: "Connector",
    emails: emails("fadel.fawaz@bayer.com"),
  },
  {
    id: "eam-17",
    path: "/System/Core/EMEA-MAR-CSA-P0-RELAY-001/EMEA-MAR-CSA-P1-RELAY-001/EMEA-MAR-CSA-P2-VL2216-001",
    type: "Connector",
    emails: emails(
      "satria.hagas.syahputra.ext@bayer.com",
      "fadel.fawaz@bayer.com"
    ),
  },
  {
    id: "eam-18",
    path: "/System/Core/EMEA-MAR-CSA-P0-RELAY-001/EMEA-MAR-CSA-P1-RELAY-001/EMEA-MAR-CSA-P2-VL2217-001",
    type: "Connector",
    emails: emails("fadel.fawaz@bayer.com"),
  },
  {
    id: "eam-19",
    path: "/System/Core/LA-ARG-PLA-P0-RELAY-001/LA-ARG-PLA-LOCALCORE-001",
    type: "Local Core",
    emails: emails(
      "satria.hagas.syahputra.ext@bayer.com",
      "fadel.fawaz@bayer.com"
    ),
  },
  {
    id: "eam-20",
    path: "/System/Core/NA-US-MYR-P0-RELAY-001/NA-US-MYR-LOCALCORE-001",
    type: "Local Core",
    emails: emails("fadel.fawaz@bayer.com"),
  },
  {
    id: "eam-21",
    path: "/System/Core/NA-US-ENTERPRISE-001/GTSB-CIM-DMC-IRIS-Table",
    type: "GTSB",
    emails: [],
  },
  {
    id: "eam-22",
    path: "/System/Core/NA-US-ENTERPRISE-001/GTSB-GRZ-EDH-Dezem",
    type: "GTSB",
    emails: [],
  },
];

export function findEamObject(id) {
  return eamCriticalObjects.find((o) => o.id === id) || null;
}

export function addEmail(id, email) {
  const obj = findEamObject(id);
  if (!obj) return { ok: false, error: "Object not found" };
  const clean = String(email || "")
    .trim()
    .toLowerCase();
  if (!clean) return { ok: false, error: "Enter an email address" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { ok: false, error: "Invalid email format" };
  }
  if (obj.emails.some((e) => e.toLowerCase() === clean)) {
    return { ok: false, error: "Email already on this object" };
  }
  obj.emails.push(clean);
  return { ok: true };
}

export function removeEmail(id, email) {
  const obj = findEamObject(id);
  if (!obj) return { ok: false, error: "Object not found" };
  const before = obj.emails.length;
  obj.emails = obj.emails.filter((e) => e.toLowerCase() !== String(email).toLowerCase());
  if (obj.emails.length === before) {
    return { ok: false, error: "Email not found" };
  }
  return { ok: true };
}
