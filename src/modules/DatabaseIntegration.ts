// Database Integration Module for BPMN.js
// This module handles database operations for BPMN elements

// Define types for database entities
export interface Process {
  id: string;
  name: string;
  playbookId: string;
  bpmnId?: string;
  bpmnXml?: string | null;
}

export interface Node {
  id: string;
  name: string;
  type: string;
  processId: string;
  bpmnId?: string;
}

// Define database callback types
export interface DatabaseCallbacks {
  onElementCreate?: (data: any) => Promise<any>;
  onElementUpdate?: (data: any) => Promise<any>;
  onElementDelete?: (data: any) => Promise<any>;
}

// The main DatabaseIntegration class
class DatabaseIntegration {
  private eventBus: any;
  private elementRegistry: any;
  private modeling: any;

  private processes: Process[] = [];
  private nodes: Node[] = [];

  private onElementCreate: ((data: any) => Promise<any>) | null = null;
  private onElementUpdate: ((data: any) => Promise<any>) | null = null;
  private onElementDelete: ((data: any) => Promise<any>) | null = null;

  private currentPlaybookId: string | null = null;
  private currentProcessId: string | null = null;

  // Track processed elements to prevent duplicate handling
  private processedElements: Set<string> = new Set();
  private isImporting: boolean = false; // Flag to indicate import operation

  constructor(eventBus: any, elementRegistry: any, modeling: any) {
    this.eventBus = eventBus;
    this.elementRegistry = elementRegistry;
    this.modeling = modeling;

    // Register event listeners
    this.registerEventListeners();
  }

  private registerEventListeners(): void {
    // Listen for element selection
    this.eventBus.on('element.click', (event: any) => {
      const { element } = event;

      // Find database information for the clicked element
      const databaseInfo = this.getDatabaseInfo(element);

      // Emit a custom event with database info
      this.eventBus.fire('database.element.selected', {
        element,
        databaseInfo
      });
    });

    // Listen for element creation
    this.eventBus.on('shape.added', (event: any) => {
      const { element } = event;

      // Avoid duplicate processing
      if (this.processedElements.has(element.id)) return;

      // Wait a bit to ensure the element is fully created
      setTimeout(() => {
        this.handleElementCreated(element);
        this.processedElements.add(element.id);
      }, 100);
    });

    // Listen for element updates
    this.eventBus.on('element.changed', (event: any) => {
      const { element } = event;
      // Do not trigger update if we are in the middle of an import and sync cycle,
      // or if onElementUpdate is temporarily disabled (e.g. during syncDatabaseElements)
      if (this.isImporting && !this.onElementUpdate) {
        return;
      }
      this.handleElementUpdated(element);
    });

    // Listen for element deletion
    this.eventBus.on('shape.remove', (event: any) => {
      const { element } = event;
      this.handleElementRemoved(element);
    });

    // Listen for connection creation
    this.eventBus.on('connection.added', (event: any) => {
      const { element } = event;

      // Avoid duplicate processing
      if (this.processedElements.has(element.id)) return;

      // Wait a bit to ensure the connection is fully created
      setTimeout(() => {
        this.handleElementCreated(element);
        this.processedElements.add(element.id);
      }, 100);
    });

    // Listen for connection deletion
    this.eventBus.on('connection.remove', (event: any) => {
      const { element } = event;
      this.handleElementRemoved(element);
    });

    this.eventBus.on('import.parse.start', () => {
      this.isImporting = true;
      console.log('[DatabaseIntegration] import.parse.start: isImporting = true');
    });

    this.eventBus.on('import.done', (event: any) => {
      console.log('[DatabaseIntegration] import.done event fired.');
      if (event.error) {
        console.error('[DatabaseIntegration] Import failed:', event.error);
        this.isImporting = false; 
        this.processedElements.clear(); 
        return;
      }

      this.syncDatabaseElements();

      this.processedElements.clear();
      const allElements = this.elementRegistry.getAll();
      allElements.forEach((element: any) => {
        this.processedElements.add(element.id);
      });
      console.log('[DatabaseIntegration] import.done: processedElements repopulated after sync.', Array.from(this.processedElements));
      
      this.isImporting = false; 
      console.log('[DatabaseIntegration] import.done: isImporting = false');
    });
  }

  // Set the process and node data from database
  public setDatabaseEntities(processes: Process[] = [], nodes: Node[] = []): void {
    console.log("Setting database entities:", { processes, nodes });
    this.processes = processes;
    this.nodes = nodes;
  }

  // Set the current playbook and process context
  public setContext(playbookId: string | null, processId: string | null): void {
    console.log("Setting context:", { playbookId, processId });
    this.currentPlaybookId = playbookId;
    this.currentProcessId = processId;
  }

  // Set the database operation callbacks
  public setDatabaseCallbacks(callbacks: DatabaseCallbacks = {}): void {
    this.onElementCreate = callbacks.onElementCreate || null;
    this.onElementUpdate = callbacks.onElementUpdate || null;
    this.onElementDelete = callbacks.onElementDelete || null;
  }

  // Handle element creation
  private handleElementCreated(element: any): void {
    if (!element || !this.currentProcessId || !this.onElementCreate) {
      console.log("Skipping element creation - missing dependencies", {
        hasElement: !!element,
        hasProcessId: !!this.currentProcessId,
        hasCallback: !!this.onElementCreate
      });
      return;
    }

    // Skip non-BPMN elements and elements that already have database IDs
    if (!this.isValidBpmnElement(element) || element.businessObject?.dbId) {
      console.log("Skipping invalid element or already has dbId", {
        isValid: this.isValidBpmnElement(element),
        hasDbId: !!element.businessObject?.dbId
      });
      return;
    }

    // Only store nodes, not connections
    if (!this.isStorableNode(element)) {
      console.log("Skipping non-storable element (not a node):", element.type, element.id);
      return;
    }

    // Get element details
    const elementType = this.getBpmnElementType(element);
    const elementName = this.getElementName(element);

    console.log(`Creating ${elementType} element: ${element.id} (${elementName})`);

    try {
      if (elementType === 'process') {
        this.onElementCreate({
          type: 'process',
          data: {
            name: elementName || 'New Process',
            playbookId: this.currentPlaybookId,
            bpmnId: element.id
          }
        }).then(result => {
          if (result && result.id) {
            this.setDatabaseId(element.id, result.id, 'process');
            console.log(`Process ${element.id} saved with DB ID: ${result.id}`);
          }
        }).catch(err => {
          console.error('Failed to create process in database:', err);
        });
      } else {
        this.onElementCreate({
          type: 'node',
          data: {
            name: elementName || this.getDefaultNameForElementType(elementType),
            type: elementType,
            processId: this.currentProcessId,
            bpmnId: element.id
          }
        }).then(result => {
          if (result && result.id) {
            this.setDatabaseId(element.id, result.id, 'node');
            console.log(`[handleElementCreated] Set dbId for element ${element.id}: ${result.id}`);
          }
        }).catch(err => {
          console.error('Failed to create node in database:', err);
        });
      }
    } catch (error) {
      console.error('Error in handleElementCreated:', error);
    }
  }

  // Get default name for different element types
  private getDefaultNameForElementType(elementType: string): string {
    const typeNameMap: Record<string, string> = {
      'task': 'New Task',
      'userTask': 'New User Task',
      'serviceTask': 'New Service Task',
      'startEvent': 'Start Event',
      'endEvent': 'End Event',
      'exclusiveGateway': 'Gateway',
      'parallelGateway': 'Parallel Gateway',
      'sequenceFlow': 'Connection'
    };

    return typeNameMap[elementType] || `New ${elementType}`;
  }

  // Handle element update
  private handleElementUpdated(element: any): void {
    if (!element || !this.onElementUpdate || !this.isValidBpmnElement(element)) return;

    let currentDbId = element.businessObject?.dbId;
    let dbType = element.businessObject?.dbType;

    if (!currentDbId) {
      const dbInfo = this.getDatabaseInfo(element); 
      if (dbInfo) {
        currentDbId = dbInfo.id;
        dbType = (element.type === 'bpmn:Process' || element.type === 'bpmn:Participant') ? 'process' : 'node';
      }
    }

    if (!currentDbId) {
      console.log("[DatabaseIntegration] Skipping update for element without resolved DB ID:", element.id);
      return;
    }
    
    dbType = dbType || ((element.type === 'bpmn:Process' || element.type === 'bpmn:Participant') ? 'process' : 'node');

    const elementName = this.getElementName(element);
    const elementType = this.getBpmnElementType(element);
    const shortDescription = element.businessObject?.shortDescription || null;

    if (this.onElementUpdate) {
      this.onElementUpdate({
        dbId: currentDbId, 
        type: dbType, 
        data: { 
          id: currentDbId, 
          name: elementName || this.getDefaultNameForElementType(elementType),
          bpmnId: element.id, 
          type: elementType, 
          shortDescription: shortDescription,
        }
      }).then(() => {
        console.log(`[DatabaseIntegration] Element ${element.id} (DB ID: ${currentDbId}) update processed by callback.`);
      }).catch(err => {
        console.error(`[DatabaseIntegration] Failed to update element ${element.id} (DB ID: ${currentDbId}) in database:`, err);
      });
    }
  }

  // Handle element removal
  private handleElementRemoved(element: any): void {
    const elementId = element ? element.id : 'unknown';
    if (!element || !this.isValidBpmnElement(element)) {
      if (elementId !== 'unknown') this.processedElements.delete(elementId);
      return;
    }

    if (this.isImporting) {
      console.log(`[DatabaseIntegration] Element ${elementId} removed during import, deferring DB deletion to save logic.`);
      this.processedElements.delete(elementId);
      return;
    }

    if (!this.onElementDelete) {
        this.processedElements.delete(elementId);
        return;
    }

    const dbInfo = this.getDatabaseInfo(element);
    if (!dbInfo || !dbInfo.id) {
      console.log(`[DatabaseIntegration] Element ${elementId} removed from canvas, no DB info or not synced. No DB action.`);
      this.processedElements.delete(elementId);
      return;
    }

    this.onElementDelete({
      id: dbInfo.id,
      type: element.businessObject?.dbType || (this.getBpmnElementType(element) === 'process' ? 'process' : 'node')
    }).then(() => {
      console.log(`[DatabaseIntegration] Element ${elementId} (DB ID: ${dbInfo.id}) deletion processed by callback.`);
    }).catch(err => {
      console.error(`[DatabaseIntegration] Failed to process deletion for element ${elementId} (DB ID: ${dbInfo.id}):`, err);
    });
    this.processedElements.delete(elementId);
  }

  // Get database info for an element
  public getDatabaseInfo(element: any): Process | Node | null {
    if (!element || !element.id) return null;

    if (element.type === 'bpmn:Process' || element.type === 'bpmn:Participant') {
      return this.processes.find(p => p.bpmnId === element.id) || null;
    }

    return this.nodes.find(n => n.bpmnId === element.id) || null;
  }

  // Set database ID for a BPMN element
  public setDatabaseId(elementId: string, databaseId: string, type: string = 'node'): boolean {
    try {
      const element = this.elementRegistry.get(elementId);
      if (!element) {
        console.warn(`[DatabaseIntegration] Element ${elementId} not found in registry for setDatabaseId`);
        return false;
      }

      this.modeling.updateProperties(element, {
        'dbId': databaseId,
        'dbType': type
      });

      console.log(`[DatabaseIntegration] Database ID ${databaseId} (type: ${type}) set for element ${elementId}`);
      return true;
    } catch (error) {
      console.error(`[DatabaseIntegration] Error setting database ID for ${elementId}:`, error);
      return false;
    }
  }

  // Get info for all relevant diagram elements
  public getDiagramElementsInfo(): any[] {
    try {
      const elements = this.elementRegistry.getAll();
      return elements
        .filter((element: any) => {
          const elementType = this.getBpmnElementType(element);
          return this.isStorableNode(element) || elementType === 'process';
        })
        .map((element: any) => {
          const elementType = this.getBpmnElementType(element);
          return {
            bpmnId: element.id,
            dbId: element.businessObject.dbId,
            dbType: element.businessObject.dbType || (elementType === 'process' ? 'process' : 'node'),
            elementName: this.getElementName(element),
            elementType: elementType,
            shortDescription: element.businessObject.shortDescription || null
          };
        });
    } catch (error) {
      console.error('[DatabaseIntegration] Error getting diagram elements info:', error);
      return [];
    }
  }

  // Highlight an element by database ID
  public highlightElementByDatabaseId(databaseId: string): any | null {
    try {
      const elements = this.getDiagramElementsInfo();
      const targetElement = elements.find((el: any) =>
        el.dbId === databaseId);

      if (targetElement) {
        this.eventBus.fire('database.highlight', {
          element: targetElement
        });
        return targetElement;
      }

      return null;
    } catch (error) {
      console.error('Error highlighting element by DB ID:', error);
      return null;
    }
  }

  // Helper methods
  private isValidBpmnElement(element: any): boolean {
    return element && element.type && element.type.startsWith('bpmn:');
  }

  private getBpmnElementType(element: any): string {
    if (!element || !element.type) return 'unknown';

    if (element.type === 'bpmn:Process' || element.type === 'bpmn:Participant') {
      return 'process';
    }
    if (element.type === 'bpmn:SequenceFlow') {
      return 'sequenceFlow';
    }

    const typeMap: Record<string, string> = {
      'bpmn:Task': 'task',
      'bpmn:UserTask': 'userTask',
      'bpmn:ServiceTask': 'serviceTask',
      'bpmn:StartEvent': 'startEvent',
      'bpmn:EndEvent': 'endEvent',
      'bpmn:ExclusiveGateway': 'exclusiveGateway',
      'bpmn:ParallelGateway': 'parallelGateway',
      'bpmn:SequenceFlow': 'sequenceFlow',
      'bpmn:TextAnnotation': 'textAnnotation',
      'bpmn:Group': 'group',
      'bpmn:SubProcess': 'subProcess',
      'bpmn:BoundaryEvent': 'boundaryEvent',
      'bpmn:IntermediateCatchEvent': 'intermediateCatchEvent',
      'bpmn:IntermediateThrowEvent': 'intermediateThrowEvent'
    };

    return typeMap[element.type] || element.type.replace('bpmn:', '').toLowerCase();
  }

  private getElementName(element: any): string {
    if (!element || !element.businessObject) return '';

    return element.businessObject.name || '';
  }

  // Sync diagram elements with database IDs after loading
  public syncDatabaseElements(): void {
    if (!this.elementRegistry) {
      console.warn('[DatabaseIntegration] Element registry not available for sync.');
      return;
    }
    console.log('[DatabaseIntegration] Starting syncDatabaseElements...');
    const allDiagramElements = this.elementRegistry.getAll();

    const originalOnElementUpdate = this.onElementUpdate;
    this.onElementUpdate = null; // Temporarily disable onElementUpdate

    try {
      allDiagramElements.forEach((element: any) => {
        if (!this.isValidBpmnElement(element)) {
          return;
        }
        if (element.type === 'bpmn:SequenceFlow') {
            return;
        }

        const bpmnId = element.id;
        let dbEntity: Process | Node | null = null;
        let dbType: string = 'node'; 
        
        if (element.type === 'bpmn:Process' || element.type === 'bpmn:Participant') {
          dbEntity = this.processes.find(p => p.bpmnId === bpmnId) || null;
          dbType = 'process';
        } else if (this.isStorableNode(element)) { 
          dbEntity = this.nodes.find(n => n.bpmnId === bpmnId) || null;
          dbType = 'node';
        } else {
          return; 
        }

        if (dbEntity && dbEntity.id) {
          if (element.businessObject.dbId !== dbEntity.id || element.businessObject.dbType !== dbType) {
            this.setDatabaseId(bpmnId, dbEntity.id, dbType); 
          }
        } else {
          if (element.businessObject.dbId) {
              console.warn(`[syncDatabaseElements] Element ${bpmnId} has a dbId (${element.businessObject.dbId}) but no matching entity in current DB data. Clearing its dbId.`);
              this.modeling.updateProperties(element, {
                  'dbId': undefined,
                  'dbType': undefined
              });
          }
        }
      });
    } catch (error) {
        console.error("[DatabaseIntegration] Error during syncDatabaseElements:", error);
    } finally {
        this.onElementUpdate = originalOnElementUpdate; // Restore onElementUpdate
        console.log('[DatabaseIntegration] Finished syncDatabaseElements.');
    }
  }

  private isStorableNode(element: any): boolean {
    if (!element || !element.type) return false;
    const storableTypes = [
      'bpmn:Task',
      'bpmn:UserTask',
      'bpmn:ServiceTask',
      'bpmn:StartEvent',
      'bpmn:EndEvent',
      'bpmn:ExclusiveGateway',
      'bpmn:ParallelGateway',
      'bpmn:SubProcess',
      'bpmn:BoundaryEvent',
      'bpmn:IntermediateCatchEvent',
      'bpmn:IntermediateThrowEvent',
    ];
    return storableTypes.includes(element.type);
  }
}

// Move $inject assignment outside the class definition
(DatabaseIntegration as any).$inject = ['eventBus', 'elementRegistry', 'modeling'];

export default {
  __init__: ['databaseIntegration'],
  databaseIntegration: ['type', DatabaseIntegration]
};
