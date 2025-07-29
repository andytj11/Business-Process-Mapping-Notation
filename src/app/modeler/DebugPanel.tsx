import React from 'react';
import styles from './page.module.css';
import { DebugEntry, Process } from './interfaces';

interface DebugPanelProps {
  selectedElement: any;
  debugEntries: DebugEntry[];
  processes: Process[];
  nodes: any[];
}

const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const getStatusBadgeClass = (action: string) => {
  switch (action) {
    case 'CREATE': return styles.createBadge;
    case 'UPDATE': return styles.updateBadge;
    case 'DELETE': return styles.deleteBadge;
    case 'SAVE': return styles.saveBadge;
    case 'LOAD': return styles.loadBadge;
    default: return '';
  }
};

export const DebugPanel: React.FC<DebugPanelProps> = ({
  selectedElement,
  debugEntries,
  processes,
  nodes,
}) => {
  return (
    <div className={styles.debugSection}>
      <div className={styles.debugHeader}>
        <h2>Database Operations Log</h2>
        <p>Track changes to BPMN elements in the database</p>
      </div>

      {selectedElement && (
        <div className={styles.selectedElement}>
          <h3>Selected Element</h3>
          <div className={styles.elementDetails}>
            <div><strong>Type:</strong> {selectedElement.element.type}</div>
            <div><strong>BPMN ID:</strong> {selectedElement.element.id}</div>
            <div>
              <strong>Name:</strong> {
                selectedElement.element.businessObject?.name || 'Unnamed'
              }
            </div>
            {selectedElement.databaseInfo && (
              <div>
                <strong>Database ID:</strong> {selectedElement.databaseInfo.id}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.debugTable}>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Type</th>
              <th>Element Name</th>
              <th>BPMN ID</th>
              <th>Database ID</th>
            </tr>
          </thead>
          <tbody>
            {debugEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No database operations yet. Try adding or modifying elements.
                </td>
              </tr>
            ) : (
              debugEntries.map((entry, index) => (
                <tr key={index}>
                  <td>{formatTimestamp(entry.timestamp)}</td>
                  <td>
                    <span className={`${styles.badge} ${getStatusBadgeClass(entry.action)}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td>{entry.elementType}</td>
                  <td>{entry.elementName}</td>
                  <td>{entry.bpmnId !== 'N/A' ? entry.bpmnId.substring(0, 8) + '...' : 'N/A'}</td>
                  <td>{entry.dbId || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.databaseStats}>
        <div className={styles.statCard}>
          <h4>Processes</h4>
          <div className={styles.statValue}>{processes.length}</div>
        </div>
        <div className={styles.statCard}>
          <h4>Nodes</h4>
          <div className={styles.statValue}>{nodes.length}</div>
        </div>
        <div className={styles.statCard}>
          <h4>Database Operations</h4>
          <div className={styles.statValue}>{debugEntries.length}</div>
        </div>
      </div>
    </div>
  );
};