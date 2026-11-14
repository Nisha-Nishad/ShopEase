import crypto from 'crypto';
import os from 'os';
import User from '../models/User.js';
import sendTokenResponse from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';

const getLocalNetworkIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
};

const sendRegistrationOtpEmail = async (user, otp) => {
  const message = `Hi ${user.name},\n\nWelcome to ShopEase! Your 6-digit email verification OTP is:\n\n${otp}\n\nThis OTP is valid for 10 minutes. Please enter it on the registration screen to activate your account.\n\nIf you did not request this, please ignore this email.`;

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;color:#0f172a;">
      <h2 style="color:#4f46e5;margin:0 0 12px;font-size:22px;">Verify Your ShopEase Account</h2>
      <p style="font-size:14px;color:#334155;line-height:1.6;">Hi <strong>${user.name}</strong>,</p>
      <p style="font-size:14px;color:#334155;line-height:1.6;">
        Thank you for signing up with ShopEase! Please use the 6-digit One-Time Password (OTP) below to verify your email address and activate your account:
      </p>
      <div style="margin:24px 0;text-align:center;">
        <div style="display:inline-block;background:#eef2ff;border:2px dashed #4f46e5;color:#312e81;font-weight:800;font-size:28px;letter-spacing:8px;padding:14px 28px;border-radius:12px;">
          ${otp}
        </div>
      </div>
      <p style="font-size:12px;color:#64748b;text-align:center;margin:0 0 16px;">
        This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
      <p style="font-size:12px;color:#94a3b8;margin:0;">
        If you did not create an account on ShopEase, you can safely ignore this email.
      </p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject: `${otp} is your ShopEase Account Verification OTP`,
    message,
    html,
  });
};

/**
 * @desc    Register a new user & send 6-digit Email Verification OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Check if user already exists
    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      res.status(400);
      throw new Error('An account with this email already exists');
    }

    if (user && !user.isVerified) {
      // Update pending unverified registration with latest details
      user.name = name;
      user.password = password;
      user.phone = phone || '';
    } else {
      // Create new unverified user
      user = new User({
        name,
        email,
        password,
        phone: phone || '',
        isVerified: false,
      });
    }

    // 2. Generate 6-digit OTP and save user
    const otp = user.generateEmailOTP();
    await user.save();

    // 3. Send OTP to user's Gmail
    const emailResult = await sendRegistrationOtpEmail(user, otp);
    const isDevPreview = emailResult?.mode === 'dev_preview';

    res.status(200).json({
      success: true,
      requiresOtp: true,
      email: user.email,
      message: isDevPreview
        ? `6-digit OTP generated for ${user.email}`
        : `We have sent a 6-digit OTP to ${user.email}. Please enter the OTP below to verify and complete your registration.`,
      ...(isDevPreview && { devOtp: otp }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify 6-digit Email OTP to activate newly registered account
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const hashedOtp = crypto
      .createHash('sha256')
      .update(String(otp).trim())
      .digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      emailOtp: hashedOtp,
      emailOtpExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired OTP. Please check the code or click Resend OTP.');
    }

    user.isVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Your account is now active — please sign in.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend 6-digit Email Verification OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      res.status(404);
      throw new Error('No pending account found with this email address');
    }

    if (user.isVerified) {
      res.status(400);
      throw new Error('This account is already verified. You can sign in directly.');
    }

    const otp = user.generateEmailOTP();
    await user.save({ validateBeforeSave: false });

    const emailResult = await sendRegistrationOtpEmail(user, otp);
    const isDevPreview = emailResult?.mode === 'dev_preview';

    res.status(200).json({
      success: true,
      email: user.email,
      message: isDevPreview
        ? `New 6-digit OTP generated for ${user.email}`
        : `A new 6-digit OTP has been sent to ${user.email}!`,
      ...(isDevPreview && { devOtp: otp }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & set httpOnly JWT cookie (Only eligible after Email OTP verification)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email and explicitly include the password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // 2. Check if user is blocked
    if (user.isBlocked) {
      res.status(403);
      throw new Error('Your account has been suspended. Please contact support.');
    }

    // 3. Compare entered password with hashed password in DB
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // 4. Check if user has verified their email OTP
    if (!user.isVerified) {
      const otp = user.generateEmailOTP();
      await user.save({ validateBeforeSave: false });
      const emailResult = await sendRegistrationOtpEmail(user, otp);
      const isDevPreview = emailResult?.mode === 'dev_preview';

      return res.status(403).json({
        success: false,
        requiresOtp: true,
        email: user.email,
        message:
          'Please verify your email first! We have sent a 6-digit OTP to your registered email.',
        ...(isDevPreview && { devOtp: otp }),
      });
    }

    // 5. Send JWT cookie and response
    sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user & clear httpOnly cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = async (req, res, next) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot Password - Generate token & send reset link via email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('No user found with that email address');
    }

    // 1. Generate reset token and save hashed token + expiry to DB
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // 2. Construct frontend reset password URL (supports exact browser port + Wi-Fi LAN IP for mobile)
    const rawOrigin =
      req.body.clientUrl ||
      req.headers.origin ||
      process.env.CLIENT_URL ||
      'http://localhost:5173';
    const clientUrl = rawOrigin.replace(/\/+$/, '');
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const lanIp = getLocalNetworkIP();
    const portMatch = clientUrl.match(/:(\d+)$/);
    const port = portMatch ? portMatch[1] : '5173';
    const lanResetUrl =
      lanIp && (clientUrl.includes('localhost') || clientUrl.includes('127.0.0.1'))
        ? `http://${lanIp}:${port}/reset-password/${resetToken}`
        : null;

    const message = `Hi ${user.name},\n\nYou requested a password reset for your ShopEase account.\n\nClick the link below to set a new password (valid for 15 minutes):\n${resetUrl}\n${
      lanResetUrl ? `\nMobile / Wi-Fi Link:\n${lanResetUrl}\n` : ''
    }\nOr enter this Reset Code on the Forgot Password page:\n${resetToken}\n\nIf you did not request this, please ignore this email.`;

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;color:#0f172a;">
        <h2 style="color:#4f46e5;margin:0 0 12px;font-size:22px;">ShopEase Password Reset</h2>
        <p style="font-size:14px;color:#334155;line-height:1.6;">Hi <strong>${user.name}</strong>,</p>
        <p style="font-size:14px;color:#334155;line-height:1.6;">
          We received a request to reset the password for your ShopEase account. Click the button below (valid for <strong>15 minutes</strong>):
        </p>
        <div style="margin:22px 0;text-align:center;">
          <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;margin:4px;">
            Reset Password (Laptop / PC)
          </a>
          ${
            lanResetUrl
              ? `<br/><a href="${lanResetUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;font-weight:600;font-size:13px;padding:10px 20px;border-radius:10px;text-decoration:none;margin-top:8px;">
                  Open on Mobile Phone (Same Wi-Fi)
                </a>`
              : ''
          }
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin:18px 0;text-align:center;">
          <p style="font-size:12px;color:#64748b;margin:0 0 6px;">
            Checking Gmail on your phone while ShopEase is open on your laptop? Copy this <strong>Reset Code</strong> and paste it on the Forgot Password page:
          </p>
          <code style="display:inline-block;background:#ffffff;border:1px solid #cbd5e1;padding:6px 12px;border-radius:8px;font-size:13px;font-weight:700;color:#4f46e5;word-break:break-all;">${resetToken}</code>
        </div>
        <p style="font-size:12px;color:#64748b;line-height:1.5;word-break:break-all;">
          Direct Link:<br/>
          <a href="${resetUrl}" style="color:#4f46e5;">${resetUrl}</a>
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
        <p style="font-size:12px;color:#94a3b8;margin:0;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'ShopEase Password Reset Link',
        message,
        html,
      });

      const isDevPreview = emailResult?.mode === 'dev_preview';

      res.status(200).json({
        success: true,
        emailSent: !isDevPreview,
        message: isDevPreview
          ? 'Reset link generated! (Add your Gmail & App Password in server/.env to receive it in Gmail inbox)'
          : `Password reset link has been sent to ${user.email}! Please check your Gmail Inbox (and Spam folder).`,
        ...(isDevPreview && { devResetUrl: resetUrl }),
      });
    } catch (emailError) {
      // Rollback token fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500);
      throw new Error(
        `Gmail SMTP Error: ${emailError.message || 'Could not send reset email. Check SMTP_USER and SMTP_PASS in server/.env'}`
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset Password using token from email link
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    // 1. Hash the raw token from URL params to compare with DB hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // 2. Find user with matching token that has not expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired password reset token');
    }

    // 3. Set new password and clear reset token fields
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // 4. Log the user in immediately with a fresh JWT cookie
    sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile (name, phone, addresses)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (Array.isArray(req.body.addresses)) {
      user.addresses = req.body.addresses;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password for logged-in user
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400);
      throw new Error('Please provide current password and a new password (min 6 chars)');
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};
