/** Mock Health Monitor tree / props / counters — replace with HM APIs later. */

export const treeRoots = [
  {
    id: "io-model",
    name: "I/O Model",
    type: "Model",
    path: "/I/O Model",
    children: [
      {
        id: "system",
        name: "System",
        type: "System",
        path: "/System",
        children: [
          {
            id: "core",
            name: "Core",
            type: "Core",
            path: "/System/Core",
            objectId: "1.9.0 (281474977300480)",
            state: "COMM_GOOD | STATE_GOOD | OBJ_ENABLED",
            children: [
              {
                id: "gcl",
                name: "_Global Core Logic",
                type: "Folder",
                path: "/System/Core/_Global Core Logic",
                objectId: "1.9.1",
                state: "COMM_GOOD | STATE_GOOD | OBJ_ENABLED",
                children: [
                  {
                    id: "dev",
                    name: "Development",
                    type: "Folder",
                    path: "/System/Core/_Global Core Logic/Development",
                    objectId: "1.9.1.1",
                    state: "COMM_GOOD | STATE_GOOD | OBJ_ENABLED",
                    children: [
                      {
                        id: "ssai",
                        name: "Smart Sentinel AI",
                        type: "Folder",
                        path: "/System/Core/_Global Core Logic/Development/Smart Sentinel AI",
                        objectId: "1.9.1.1.1",
                        state: "COMM_GOOD | STATE_GOOD | OBJ_ENABLED",
                        children: [],
                      },
                    ],
                  },
                ],
              },
              {
                id: "connector-1",
                name: "EMEA-DEU-GRZ-P0-RELAY-001",
                type: "Connector",
                path: "/System/Core/EMEA-DEU-GRZ-P0-RELAY-001",
                objectId: "2.1.0",
                state: "COMM_GOOD | STATE_GOOD | OBJ_ENABLED",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "server-model",
    name: "Server Model",
    type: "Model",
    path: "/Server Model",
    children: [
      {
        id: "webapi",
        name: "Web API Server",
        type: "WebAPIServer",
        path: "/Server Model/Web API Server",
        objectId: "3.0.1",
        state: "COMM_GOOD | STATE_GOOD | OBJ_ENABLED",
        children: [],
      },
      {
        id: "opc-server",
        name: "BIDCIMS0025 - CIM OPC Server",
        type: "Server",
        path: "/Server Model/BIDCIMS0025 - CIM OPC Server",
        objectId: "3.1.0",
        state: "COMM_GOOD | STATE_GOOD | OBJ_ENABLED",
        children: [],
      },
    ],
  },
];

/** Counters keyed by node id — sample HM-style rows. */
export const countersByNode = {
  core: [
    {
      ObjectName: "Active scripts",
      type: "PerformanceCounter",
      group: "Core",
      Value: 89,
      Unit: "Scripts",
      Description: "Number of active Lua scripts",
      penName: 'CORE "Core" - Active scripts',
      path: "/System/Core/.../Active scripts",
    },
    {
      ObjectName: "Backlog",
      type: "PerformanceCounter",
      group: "Core",
      Value: 2.527,
      Unit: "Items",
      Description: "Current backlog size",
      penName: 'CORE "Core" - Backlog',
      path: "/System/Core/.../Backlog",
    },
    {
      ObjectName: "Connected Servers",
      type: "PerformanceCounter",
      group: "Core",
      Value: 14,
      Unit: "Connectors",
      Description: "Connected connector count",
      penName: 'CORE "Core" - Connected Servers',
      path: "/System/Core/.../Connected Servers",
    },
    {
      ObjectName: "Disk Usage",
      type: "HealthCalculation",
      group: "Host",
      Value: 67.2,
      Unit: "%",
      Description: "Host disk usage",
      penName: 'CORE "Core" - Disk Usage',
      path: "/System/Core/.../Disk Usage",
    },
    {
      ObjectName: "Host CPU Load Avg",
      type: "PerformanceCounter",
      group: "Host",
      Value: 9.94,
      Unit: "%",
      Description: "Average host CPU load",
      penName: 'CORE "Core" - Host CPU Load Avg',
      path: "/System/Core/.../Host CPU Load Avg",
    },
    {
      ObjectName: "inmation CPU Usage",
      type: "PerformanceCounter",
      group: "Core",
      Value: 12.1,
      Unit: "%",
      Description: "inmation process CPU usage",
      penName: 'CORE "Core" - inmation CPU Usage',
      path: "/System/Core/.../inmation CPU Usage",
    },
  ],
  "connector-1": [
    {
      ObjectName: "Current Lag Time",
      type: "PerformanceCounter",
      group: "Connector",
      Value: 172.7,
      Unit: "ms",
      Description: "Current lag time",
      penName: 'CONNECTOR "RELAY-001" - Current Lag Time',
      path: "/System/Core/EMEA-DEU-GRZ-P0-RELAY-001/.../Lag",
    },
    {
      ObjectName: "Host Disk Usage Max",
      type: "HealthCalculation",
      group: "Host",
      Value: 81.3,
      Unit: "%",
      Description: "Max host disk usage",
      penName: 'CONNECTOR "RELAY-001" - Disk Usage',
      path: "/System/Core/EMEA-DEU-GRZ-P0-RELAY-001/.../Disk",
    },
  ],
  default: [
    {
      ObjectName: "Object Load",
      type: "PerformanceCounter",
      group: "Generic",
      Value: 0,
      Unit: "%",
      Description: "Object load",
      penName: "Generic - Object Load",
      path: "/…/Object Load",
    },
  ],
};

export function propsForNode(node) {
  if (!node) return null;
  return {
    ObjectName: node.name,
    Type: node.type,
    ObjectID: node.objectId || "—",
    ObjectIDExtended: node.objectId
      ? `1.9.0 (${node.objectId})`
      : "—",
    Path: node.path,
    ConfigVersion: "3034",
    ClassVersion: "2.1277.0.0",
    Created: { date: 1540219826031, user: "$system($anonymous)" },
    Modified: { date: 1753025712786, user: "$gui(AD-BAYER-CNB\\GOAKJ)" },
    State: node.state || "COMM_GOOD|STATE_GOOD|OBJ_ENABLED",
    Image: node.image || "./assets/model/classes/Core.svg",
  };
}

export function countersForNode(nodeId) {
  return countersByNode[nodeId] || countersByNode.default;
}

/** Flat navigation table for list view (mock) — includes Bad / Neutral samples. */
export const mockNavTableRows = [
  {
    id: "system",
    name: "System",
    path: "/System",
    type: "SYSTEM",
    WorstState: "Good",
    CommState: "Good",
    ObjectState: "Good",
    State: "COMM_GOOD|STATE_GOOD|OBJ_ENABLED",
  },
  {
    id: "core",
    name: "Core",
    path: "/System/Core",
    type: "CORE",
    WorstState: "Good",
    CommState: "Good",
    ObjectState: "Good",
    State: "COMM_GOOD|STATE_GOOD|OBJ_ENABLED",
  },
  {
    id: "connector-1",
    name: "EMEA-DEU-GRZ-P0-RELAY-001",
    path: "/System/Core/EMEA-DEU-GRZ-P0-RELAY-001",
    type: "CONNECTOR",
    WorstState: "Warning",
    CommState: "Neutral",
    ObjectState: "Neutral",
    State: "COMM_GOOD|STATE_GOOD|OBJ_ENABLED",
  },
  {
    id: "webapi",
    name: "Web API Server",
    path: "/Server Model/Web API Server",
    type: "RELAY",
    WorstState: "Disabled",
    CommState: "Good",
    ObjectState: "Disabled",
    State: "COMM_GOOD|STATE_GOOD|OBJ_DISABLED",
  },
  {
    id: "opc-server",
    name: "BIDCIMS0025 - CIM OPC Server",
    path: "/Server Model/BIDCIMS0025 - CIM OPC Server",
    type: "DATASOURCE",
    WorstState: "Bad",
    CommState: "Bad",
    ObjectState: "Good",
    State: "COMM_ERROR|STATE_ERROR|OBJ_ENABLED",
  },
];
