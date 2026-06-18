/** Role constants — must match the backend (config/constants.js). */
export const ROLES = Object.freeze({
  ADMIN: 'Admin',
  CLOUD_ENGINEER: 'Cloud Engineer',
  DEVOPS_ENGINEER: 'DevOps Engineer',
  VIEWER: 'Viewer'
});

export const ALL_ROLES = Object.values(ROLES);
