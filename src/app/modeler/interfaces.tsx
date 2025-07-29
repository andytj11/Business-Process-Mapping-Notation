export interface DebugEntry {
    action: string;
    timestamp: Date;
    elementType: string;
    elementName: string;
    bpmnId: string;
    dbId?: string;
    details?: string;
  }
  
  export interface Playbook {
    id: string;
    name: string;
  }
  
  export interface Process {
    id: string;
    name: string;
    bpmnXml?: string;
    bpmnId?: string;
  }
  
  export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
  }