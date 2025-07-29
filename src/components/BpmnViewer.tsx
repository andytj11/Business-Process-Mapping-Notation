import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import BpmnViewer from 'bpmn-js/lib/Viewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import DatabaseIntegration from '../modules/DatabaseIntegration';

interface Process {
  id: string;
  name: string;
  bpmnXml?: string;
  bpmnId?: string;
}

interface Node {
  id: string;
  name: string;
  type: string;
  processId: string;
  bpmnId?: string;
}

interface BpmnViewerProps {
  xml?: string;
  processes?: Process[];
  nodes?: Node[];
  onElementSelect?: (element: any, databaseInfo: any) => void;
  highlightedElementIds?: string[]; // Database IDs to highlight
}

// Define the ref interface
interface BpmnViewerRef {
  getViewer: () => any;
  highlightElementByDatabaseId: (dbId: string) => void;
}

const BpmnViewerComponent = forwardRef<BpmnViewerRef, BpmnViewerProps>((props, ref) => {
  const {
    xml,
    processes = [],
    nodes = [],
    onElementSelect,
    highlightedElementIds = [],
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current) return;

    // Create viewer instance with custom modules
    const viewer = new BpmnViewer({
      container: containerRef.current,
      additionalModules: [
        DatabaseIntegration
      ]
    });

    viewerRef.current = viewer;

    // Import initial diagram
    if (xml) {
      try {
        viewer.importXML(xml).then(() => {
          viewer.get('canvas').zoom('fit-viewport');
          setLoaded(true);
        });
      } catch (err) {
        console.error('Error importing BPMN diagram:', err);
      }
    }

    // Clean up
    return () => {
      viewer.destroy();
    };
  }, [xml]);

  // Handle database entities updates
  useEffect(() => {
    if (!viewerRef.current || !loaded) return;

    // Get the database integration module instance
    const databaseIntegration = viewerRef.current.get('databaseIntegration');
    if (databaseIntegration) {
      // Update the module with current database entities
      databaseIntegration.setDatabaseEntities(processes, nodes);
    }

    // Map database IDs to BPMN elements
    mapDatabaseIdsToBpmnElements();
  }, [processes, nodes, loaded]);

  // Add event listeners
  useEffect(() => {
    if (!viewerRef.current || !loaded) return;

    const eventBus = viewerRef.current.get('eventBus');
    
    // Listen for element selection
    const onElementSelectHandler = (event: any) => {
      const { element, databaseInfo } = event;
      if (onElementSelect) {
        onElementSelect(element, databaseInfo);
      }
    };

    // Register for the custom event from our module
    eventBus.on('database.element.selected', onElementSelectHandler);

    // Clean up
    return () => {
      eventBus.off('database.element.selected', onElementSelectHandler);
    };
  }, [onElementSelect, loaded]);

  // Handle element highlighting
  useEffect(() => {
    if (!viewerRef.current || !loaded || !highlightedElementIds.length) return;

    const databaseIntegration = viewerRef.current.get('databaseIntegration');
    const canvas = viewerRef.current.get('canvas');
    
    if (!databaseIntegration || !canvas) return;

    // Clear previous highlights
    canvas.clearHighlight();

    // Apply new highlights
    highlightedElementIds.forEach(dbId => {
      const element = databaseIntegration.highlightElementByDatabaseId(dbId);
      if (element) {
        canvas.addMarker(element.id, 'highlight');
      }
    });
  }, [highlightedElementIds, loaded]);

  // Map database IDs to BPMN elements
  const mapDatabaseIdsToBpmnElements = () => {
    if (!viewerRef.current) return;

    const databaseIntegration = viewerRef.current.get('databaseIntegration');
    const elementRegistry = viewerRef.current.get('elementRegistry');
    
    if (!databaseIntegration || !elementRegistry) return;

    // Map process IDs
    processes.forEach(process => {
      if (process.bpmnId) {
        databaseIntegration.setDatabaseId(process.bpmnId, process.id, 'process');
      }
    });

    // Map node IDs
    nodes.forEach(node => {
      if (node.bpmnId) {
        databaseIntegration.setDatabaseId(node.bpmnId, node.id, 'node');
      }
    });
  };

  // Method to highlight element by database ID
  const highlightElementByDatabaseId = (dbId: string) => {
    if (!viewerRef.current || !loaded) return;

    const databaseIntegration = viewerRef.current.get('databaseIntegration');
    const canvas = viewerRef.current.get('canvas');
    
    if (!databaseIntegration || !canvas) return;

    const element = databaseIntegration.highlightElementByDatabaseId(dbId);
    if (element) {
      canvas.addMarker(element.id, 'highlight');
    }
  };

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    getViewer: () => viewerRef.current,
    highlightElementByDatabaseId
  }), [loaded]);

  return (
    <div className="bpmn-viewer-container" style={{ width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
});

// Add display name for better debugging
BpmnViewerComponent.displayName = 'BpmnViewerComponent';

export default BpmnViewerComponent;