export enum UserRole {
  ADMIN01 = 'admin01',
  ADMIN02 = 'admin02',
  SUPERVISOR = 'supervisor',
}

export const AppRoutes = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  OUTGOING_NEW: '/outgoing/new',
  INCOMING_LIST: '/incoming',
  INCOMING_FORM: '/incoming/form',
  APPROVAL: '/approval',
  PRINT_OUTGOING: '/print/outgoing',
  PRINT_INCOMING: '/print/incoming',
  SUPERVISOR: '/supervisor',
  REPORTS: '/reports',
  PROFILE: '/profile',
};

export const MOCK_API_DELAY = 500;
