import jwt from 'jsonwebtoken';

/**
 * Generates a JWT token for a user, sets it in an httpOnly cookie,
 * and sends a standardized JSON response.
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // 1. Create signed JWT containing user ID and role
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );

  // 2. Configure httpOnly cookie options (7 days)
  const cookieOptions = {
    httpOnly: true, // Prevents client-side JS from reading the cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };

  // 3. Send cookie and user object (excluding password)
  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses || [],
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
};

export default sendTokenResponse;
