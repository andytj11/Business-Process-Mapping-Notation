// API services for interfacing with the backend
import { 
    CreatePlaybookPayload, UpdatePlaybookPatchPayload, UpdatePlaybookPutPayload, SharePlaybookPayload,
    CreateProcessPayload, UpdateProcessPatchPayload, UpdateProcessPutPayload,
    CreateNodePayload, UpdateNodePayload,
    CreateProcessParameterPayload, UpdateProcessParameterPayload,
    CreateProcessDependencyPayload,
    Event as EventType, 
    Playbook,
    ImplementorPlaybook, // Import ImplementorPlaybook
    ShareRequestBody,
    ShareAdvancedResponse,
    GetPlaybookByIdOptions
} from '@/types/api';

const API_BASE_URL = '/api';

// Helper function for API calls - now generic
const apiCall = async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers, 
    },
    credentials: 'include', 
    ...options, 
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>; // Cast to Promise<T>
};

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText || `HTTP error! status: ${response.status}` };
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// Playbook API operations
export const PlaybookAPI = {
  getAll: (params?: { ownerId?: string; status?: string; isCopy?: boolean }): Promise<Playbook[]> => {
    let url = '/api/playbooks';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.ownerId) queryParams.append('ownerId', params.ownerId);
      if (params.status) queryParams.append('status', params.status);
      // Add isCopy to distinguish original playbooks from implementations for "My Playbooks"
      if (params.isCopy !== undefined) queryParams.append('isCopy', String(params.isCopy));
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    return apiCall<Playbook[]>(url); // Use generic apiCall
  },
  async getById(playbookId: string, options?: GetPlaybookByIdOptions): Promise<Playbook> {
    let url = `${API_BASE_URL}/playbooks/${playbookId}`;
    if (options) {
      const queryParams = new URLSearchParams();
      if (options.includeProcess) queryParams.append('includeProcess', 'true');
      if (options.includeNodes) queryParams.append('includeNodes', 'true');
      if (options.includeNodeParams) queryParams.append('includeNodeParams', 'true');
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    const response = await fetch(url);
    return handleApiResponse<Playbook>(response);
  },
  create: (data: CreatePlaybookPayload): Promise<Playbook> => apiCall<Playbook>('/api/playbooks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (id: string, data: UpdatePlaybookPutPayload): Promise<Playbook> => apiCall<Playbook>(`/api/playbooks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  patch: (id: string, data: UpdatePlaybookPatchPayload): Promise<Playbook> => apiCall<Playbook>(`/api/playbooks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<any> => apiCall(`/api/playbooks/${id}`, { // Adjust return type if known
    method: 'DELETE',
  }),
  share: (playbookId: string, data: SharePlaybookPayload): Promise<any> => apiCall(`/api/playbooks/${playbookId}/share`, { // Adjust return type if known
    method: 'POST',
    body: JSON.stringify(data),
  }),
  async shareAdvanced(playbookId: string, payload: ShareRequestBody): Promise<ShareAdvancedResponse> {
    const response = await fetch(`${API_BASE_URL}/playbooks/${playbookId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'include', 
    });
    return handleApiResponse<ShareAdvancedResponse>(response);
  },
  getCollaborationPlaybooks: (): Promise<Playbook[]> => {
    return apiCall<Playbook[]>(`${API_BASE_URL}/playbooks/collaborations`);
  },
  getImplementorPlaybooks: (): Promise<ImplementorPlaybook[]> => {
    return apiCall<ImplementorPlaybook[]>(`${API_BASE_URL}/playbooks/implementations`);
  },
};

// Process API operations
export const ProcessAPI = {
  getAll: (params?: { playbookId?: string }) => {
    let url = '/api/processes';
    if (params?.playbookId) {
      const queryParams = new URLSearchParams();
      queryParams.append('playbookId', params.playbookId);
      url += `?${queryParams.toString()}`;
    }
    return apiCall(url);
  },
  getById: (id: string) => apiCall(`/api/processes/${id}`),
  create: (data: CreateProcessPayload) => apiCall('/api/processes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (id: string, data: UpdateProcessPutPayload) => apiCall(`/api/processes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  patch: (id: string, data: UpdateProcessPatchPayload) => apiCall(`/api/processes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/api/processes/${id}`, {
    method: 'DELETE',
  }),

  // Process Parameters
  getProcessParameters: (processId: string) => apiCall(`/api/processes/${processId}/parameters`),
  createProcessParameters: (processId: string, data: { parameters: CreateProcessParameterPayload[] }) => apiCall(`/api/processes/${processId}/parameters`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProcessParameter: (processId: string, data: UpdateProcessParameterPayload) => apiCall(`/api/processes/${processId}/parameters`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProcessParameter: (processId: string, parameterId: string) => apiCall(`/api/processes/${processId}/parameters?id=${parameterId}`, {
    method: 'DELETE',
  }),

  // Process Dependencies
  getProcessDependencies: (processId: string) => apiCall(`/api/processes/${processId}/dependencies`),
  createProcessDependency: (processId: string, data: CreateProcessDependencyPayload) => apiCall(`/api/processes/${processId}/dependencies`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteProcessDependency: (processId: string, dependencyId: string) => apiCall(`/api/processes/${processId}/dependencies?dependencyId=${dependencyId}`, {
    method: 'DELETE',
  }),
};

// Node API operations
export const NodeAPI = {
  // Get all nodes for a specific process, including their parameters
  getByProcess: (processId: string) => apiCall(`/api/processes/${processId}/nodes`),
  
  // Get all nodes, optionally filtered by processId, or a single node by id
  getAll: (params?: { processId?: string }) => {
    let url = '/api/node';
    if (params?.processId) {
      const queryParams = new URLSearchParams();
      queryParams.append('processId', params.processId);
      url += `?${queryParams.toString()}`;
    }
    return apiCall(url);
  },
  
  // Get a specific node by its ID
  getById: (id: string) => apiCall(`/api/node?id=${id}`),
  
  // Create a new node
  create: (data: CreateNodePayload) => apiCall('/api/node', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update an existing node (PATCH /api/node, body includes id)
  update: (data: UpdateNodePayload) => apiCall('/api/node', {
    method: 'PATCH',
    body: JSON.stringify(data), // data includes the id of the node
  }),
  
  // Delete a node by its ID
  delete: (id: string) => apiCall(`/api/node?id=${id}`, {
    method: 'DELETE',
  }),
};

// Event API operations
export const EventAPI = {
  getAll: (params?: { userId?: string; playbookId?: string }) => {
    let url = '/api/event';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.playbookId) queryParams.append('playbookId', params.playbookId);
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    return apiCall(url);
  },
  create: (data: Partial<EventType>) => apiCall('/api/event', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
