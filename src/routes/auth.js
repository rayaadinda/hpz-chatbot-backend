import express from 'express';
import { authenticateUser, optionalAuth } from '../middleware/supabaseAuth.js';
import openRouterService from '../services/openRouter.js';

const router = express.Router();

/**
 * GET /api/auth/validate
 * Validate user authentication token
 */
router.get('/validate', authenticateUser, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      user_metadata: req.user.user_metadata,
    },
    message: 'Authentication successful',
  });
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticateUser, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      user_metadata: req.user.user_metadata,
      app_metadata: req.user.app_metadata,
      created_at: req.user.created_at,
    },
  });
});

/**
 * POST /api/auth/validate-key
 * Validate OpenRouter API key (for admin purposes)
 */
router.post('/validate-key', async (req, res) => {
  try {
    const isValid = await openRouterService.validateApiKey();

    res.json({
      success: isValid,
      message: isValid ? 'OpenRouter API key is valid' : 'Invalid OpenRouter API key',
    });
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate API key',
    });
  }
});

export default router;