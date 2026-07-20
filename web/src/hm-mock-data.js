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
      Value: 89,
      Unit: "Scripts",
      penName: 'CORE "Core" - Active scripts',
      path: "/System/Core/.../Active scripts",
    },
    {
      ObjectName: "Backlog",
      type: "PerformanceCounter",
      Value: 2.527,
      Unit: "Items",
      penName: 'CORE "Core" - Backlog',
      path: "/System/Core/.../Backlog",
    },
    {
      ObjectName: "Connected Servers",
      type: "PerformanceCounter",
      Value: 14,
      Unit: "Connectors",
      penName: 'CORE "Core" - Connected Servers',
      path: "/System/Core/.../Connected Servers",
    },
    {
      ObjectName: "Disk Usage",
      type: "HealthCalculation",
      Value: 67.2,
      Unit: "%",
      penName: 'CORE "Core" - Disk Usage',
      path: "/System/Core/.../Disk Usage",
    },
    {
      ObjectName: "Host CPU Load Avg",
      type: "PerformanceCounter",
      Value: 9.94,
      Unit: "%",
      penName: 'CORE "Core" - Host CPU Load Avg',
      path: "/System/Core/.../Host CPU Load Avg",
    },
    {
      ObjectName: "inmation CPU Usage",
      type: "PerformanceCounter",
      Value: 12.1,
      Unit: "%",
      penName: 'CORE "Core" - inmation CPU Usage',
      path: "/System/Core/.../inmation CPU Usage",
    },
  ],
  "connector-1": [
    {
      ObjectName: "Current Lag Time",
      type: "PerformanceCounter",
      Value: 172.7,
      Unit: "ms",
      penName: 'CONNECTOR "RELAY-001" - Current Lag Time',
      path: "/System/Core/EMEA-DEU-GRZ-P0-RELAY-001/.../Lag",
    },
    {
      ObjectName: "Host Disk Usage Max",
      type: "HealthCalculation",
      Value: 81.3,
      Unit: "%",
      penName: 'CONNECTOR "RELAY-001" - Disk Usage',
      path: "/System/Core/EMEA-DEU-GRZ-P0-RELAY-001/.../Disk",
    },
  ],
  default: [
    {
      ObjectName: "Object Load",
      type: "PerformanceCounter",
      Value: 0,
      Unit: "%",
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
    Path: node.path,
    ConfigVersion: "3034",
    ClassVersion: "2.1277.0.0",
    Created: "2024-03-12 08:14:22",
    Modified: "2026-07-17 14:02:11",
    State: node.state || "COMM_GOOD | STATE_GOOD | OBJ_ENABLED",
  };
}

export function countersForNode(nodeId) {
  return countersByNode[nodeId] || countersByNode.default;
}
