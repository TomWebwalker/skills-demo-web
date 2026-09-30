export interface User { id: string; name: string }
export interface Task { id: string; title: string; status: 'todo' | 'in-progress' | 'done'; assigneeId: string | null }
export interface ActivityEvent { id: string; taskId: string; actorId: string; action: 'status-changed' | 'assigned' | 'renamed'; from: string | null; to: string | null; at: string }
