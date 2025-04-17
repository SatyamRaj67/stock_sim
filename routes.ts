/***An Array of routes that are public
These routes are accessible without authentication
@type {string[]} */
export const publicRoutes = ["/", "/auth/new-verification"];

/**An Array of routes that are user for authentication
 These routes will redirect loggen in users to /settings
 @type {string[]} */
export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password",
];

/** Prefix for API Auth routes
Routes that start with this prefix are used for API authentication purposes
@type {string[]} */
export const apiAuthPrefix = "/api/auth";

/** Prefix for API Auth routes
Routes that start with this prefix are used for API authentication purposes
@type {string[]} */
export const apiRoutesPrefix = "/api";

/** The default redirect path after a user logs in
 * @type {string[]} */
export const DEFAULT_LOGIN_REDIRECT = "/settings";
