const ROLE_PERMISSIONS = {
  admin: [
    "users.read",
    "users.create",
    "users.update",
    "users.delete",
    "billing.*",
    "appointments.*",
  ],

  doctor: [
    "users.read",
    "appointments.read",
    "appointments.update",
    "patients.read",
    "patients.update",
  ],

  receptionist: [
    "appointments.create",
    "appointments.read",
    "patients.read",
  ],

  assistant: [
    "appointments.read",
    "patients.read",
  ],
};

const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];

  return (
    permissions.includes(permission) ||
    permissions.includes("*") ||
    permissions.includes(permission.split(".")[0] + ".*")
  );
};

module.exports = { ROLE_PERMISSIONS, hasPermission };