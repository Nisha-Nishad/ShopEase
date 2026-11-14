import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware: Protect private routes.
 * Reads JWT from httpOnly cookie ('token') or Authorization Bearer header,
 * verifies it, and attaches the authenticated user to req.user.
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check httpOnly cookie first (preferred & most secure)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback to Authorization header (useful for Postman/mobile testing)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401);
      throw new Error('Not authorized to access this route. Please log in.');
    }

    // 3. Verify token signature & expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find user in DB (excluding password)
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      res.status(401);
      throw new Error('The user belonging to this token no longer exists.');
    }

    // 5. Check if user account has been blocked by Admin
    if (currentUser.isBlocked) {
      res.status(403);
      throw new Error('Your account has been suspended. Please contact support.');
    }

    req.user = currentUser;
    next();
  } catch (error) {
    res.status(res.statusCode === 200 ? 401 : res.statusCode);
    next(error);
  }
};

/**
 * Middleware: Role-Based Access Control (RBAC).
 * Example usage: authorize('admin', 'manager')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(
          `Role '${req.user?.role || 'guest'}' is not authorized to access this resource`
        )
      );
    }
    next();
  };
};
