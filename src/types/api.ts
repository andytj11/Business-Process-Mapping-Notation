import { Status as PrismaStatus, Role as PrismaClientRole, Playbook as PrismaPlaybook } from '@prisma/client';

export type Status = PrismaStatus;
export type PlaybookCollaboratorRole = PrismaClientRole;

// Export the Role enum so it can be imported by other modules
export { PrismaClientRole as Role };

export interface User {
  id: string;
  email?: string;
}

export interface Playbook extends PrismaPlaybook {
  sourcePlaybook?: { name: string } | null;
}

export interface ImplementorPlaybook extends Playbook {
  sourcePlaybook?: { name: string } | null;
}

export interface Process {
  id: string;
  name: string;
  playbookId: string;
  shortDescription?: string | null;
  bpmnXml?: string | null;
  bpmnId?: string | null;
  createdAt: string;
  updatedAt: string;
  Node?: Node[];
  ProcessParameter?: ProcessParameter[];
  parentToProcesses?: ProcessDependency[];
  nextToProcesses?: ProcessDependency[];
}

export interface Node {
  id: string;
  name: string;
  type: string;
  shortDescription?: string | null;
  processId: string;
  bpmnId?: string | null;
  documentContent?: any | null;
  createdAt: string;
  updatedAt: string;
  ProcessParameter?: ProcessParameter[];
}

export interface ProcessParameter {
  id: string;
  name: string;
  type: string;
  mandatory: boolean;
  info?: string | null;
  options?: string[];
  nodeId?: string | null;
  processId: string;
}

export interface ProcessDependency {
  id: string;
  parentProcessId: string;
  processId: string;
  trigger?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaybookCollaborator {
  id: string;
  playbookId: string;
  userId: string;
  role: PlaybookCollaboratorRole;
  createdAt: string;
  Playbook?: Playbook;
}

export interface CreatePlaybookPayload {
  name: string;
  ownerId: string;
  shortDescription?: string;
}

export interface UpdatePlaybookPutPayload extends CreatePlaybookPayload {
  shortDescription?: string | null;
  documentContent?: any | null;
  status?: Status;
}

export type UpdatePlaybookPatchPayload = Partial<Omit<UpdatePlaybookPutPayload, 'ownerId'>>;

export interface SharePlaybookPayload {
  sharedWithUserId: string;
  role: PrismaClientRole;
}

export interface ShareRequestItem {
  email: string;
  targetUserId: string;
  shareType: 'IMPLEMENTOR' | 'COLLABORATOR';
  collaboratorRole?: PrismaClientRole;
}

export interface ShareRequestBody {
  shares: ShareRequestItem[];
  sharedByUserId: string;
}

export interface ShareResultItem {
  email: string;
  success: boolean;
  message: string;
  collaboratorId?: string;
  copiedPlaybookId?: string;
}

export interface ShareAdvancedResponse {
  results: ShareResultItem[];
}

export interface GetPlaybookByIdOptions {
  includeProcess?: boolean;
  includeNodes?: boolean;
  includeNodeParams?: boolean;
}

export interface CreateProcessPayload {
  playbookId: string;
  processName: string;
  shortDescription?: string;
  nodeList?: CreateNodePayload[];
  processParameters?: CreateProcessParameterPayload[];
  processDependency?: {
    parentProcessId: string;
    trigger?: string;
  };
}

export interface UpdateProcessPutPayload {
  name: string;
  shortDescription?: string | null;
  bpmnXml?: string | null;
}

export type UpdateProcessPatchPayload = Partial<UpdateProcessPutPayload>;

export interface CreateNodePayload {
  name: string;
  type: string;
  processId: string;
  shortDescription?: string | null;
  bpmnId?: string | null;
  documentContent?: any | null;
}

export interface UpdateNodePayload {
  id: string;
  name?: string;
  type?: string;
  shortDescription?: string | null;
  bpmnId?: string | null;
  documentContent?: any | null;
}

export interface CreateProcessParameterPayload {
  name: string;
  type: string;
  mandatory: boolean;
  info?: string | null;
  options?: string[];
  nodeId?: string | null;
}

export interface UpdateProcessParameterPayload {
  id: string;
  name?: string;
  type?: string;
  mandatory?: boolean;
  info?: string | null;
  options?: string[];
}

export interface CreateProcessDependencyPayload {
  parentProcessId: string;
  trigger?: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string | number;
}

export interface Event {
  id: string;
  name: string;
  playbookId: string;
  description?: string;
  ownerId: string;
  parameters: string[];
  status?: string | null;
  currentProcessId: string;
}