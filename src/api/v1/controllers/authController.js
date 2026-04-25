const authService = require('../../../services/authService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse } = require('../../../../utils/responseHandler');
const { logAction, logSecurityEvent } = require('../../../../utils/auditLogger');

class AuthController {
  /**
   * Login user
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password, req);

    // Set cookies
    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    // Log successful login
    await logAction({
      user: { id: result.user.id, clinicId: result.user.clinicId },
      action: 'LOGIN',
      entity: 'user',
      entityId: result.user.id,
      metadata: { email: result.user.email },
      req,
    }).catch(() => {});

    await logSecurityEvent({
      user: { id: result.user.id, clinicId: result.user.clinicId },
      eventType: 'LOGIN_SUCCESS',
      severity: 'info',
      details: { email: result.user.email },
      req,
    }).catch(() => {});

    return successResponse(res, {
      token: result.accessToken,
      user: result.user,
    }, 'Login successful');
  });

  /**
   * Register new user
   */
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body, req);
    
    // Log user registration
    await logAction({
      user: { id: result.user.id, clinicId: result.user.clinicId },
      action: 'REGISTER',
      entity: 'user',
      entityId: result.user.id,
      metadata: { email: result.user.email },
      req,
    }).catch(() => {});

    await logSecurityEvent({
      user: { id: result.user.id, clinicId: result.user.clinicId },
      eventType: 'USER_REGISTERED',
      severity: 'info',
      details: { email: result.user.email },
      req,
    }).catch(() => {});

    return successResponse(res, {
      user: result.user,
    }, 'User registered successfully', 201);
  });

  /**
   * Forgot password
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await authService.forgotPassword(email, req);
    
    return successResponse(res, null, 'Password reset email sent if account exists');
  });

  /**
   * Reset password
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password, req);
    
    // Log password reset
    await logSecurityEvent({
      user: { id: result.userId },
      eventType: 'PASSWORD_RESET',
      severity: 'info',
      details: { userId: result.userId },
      req,
    }).catch(() => {});

    return successResponse(res, null, 'Password reset successful');
  });

  /**
   * Refresh access token
   */
  refresh = asyncHandler(async (req, res) => {
    const { refreshToken: refreshTokenCookie } = req.cookies;
    const { token: oldAccessToken } = req.cookies;

    const result = await authService.refreshToken(refreshTokenCookie, oldAccessToken);

    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    return successResponse(res, {
      accessToken: result.accessToken,
    }, 'Token refreshed');
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;

    await authService.logout(refreshToken);

    // Log logout
    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'LOGOUT',
      entity: 'user',
      entityId: req.user.id,
      req,
    }).catch(() => {});

    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });

    return successResponse(res, null, 'Logged out successfully');
  });

  /**
   * Get current user
   */
  me = asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    return successResponse(res, { user });
  });
}

module.exports = new AuthController();
