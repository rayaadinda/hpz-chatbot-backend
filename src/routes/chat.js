import express from 'express';
import { authenticateUser } from '../middleware/supabaseAuth.js';
import openRouterService from '../services/openRouter.js';
import commandService from '../services/commands.js';

const router = express.Router();

/**
 * POST /api/chat/message
 * Send a message and get AI response
 */
router.post('/message', authenticateUser, async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message is required and must be a string',
      });
    }

    // Check if message is a command
    if (commandService.isCommand(message)) {
      const command = commandService.extractCommand(message);

      try {
        const commandResponse = await commandService.processCommand(command, req.user);

        // Log command usage
        console.log(`✅ Command executed: ${command} by ${req.user.email}`);

        return res.json({
          success: true,
          type: 'command',
          response: commandResponse,
          timestamp: new Date().toISOString(),
        });
      } catch (commandError) {
        console.error('Command execution error:', commandError);

        return res.status(500).json({
          error: 'Command Error',
          message: 'Failed to execute command',
        });
      }
    }

    // Regular AI chat
    try {
      // Add user context to the AI request
      const aiContext = {
        userTier: context.userTier || 'Unknown',
        userPoints: context.userPoints || 0,
        userName: req.user.user_metadata?.name || req.user.email,
      };

      const aiResponse = await openRouterService.simpleChat(message, aiContext);

      // Log successful chat interaction
      console.log(`✅ AI response sent to ${req.user.email}`);

      return res.json({
        success: true,
        type: 'ai',
        response: {
          content: aiResponse.content,
          model: aiResponse.model,
          usage: aiResponse.usage,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (aiError) {
      console.error('AI service error:', aiError);

      // Return fallback response
      return res.json({
        success: true,
        type: 'ai',
        response: {
          content: 'Maaf, sedang ada gangguan di sistem AI. Silakan coba lagi beberapa saat ya! 🙏',
          model: null,
          usage: null,
          error: aiError.message,
        },
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    console.error('Chat message error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process message',
    });
  }
});

/**
 * GET /api/chat/commands
 * Get list of available commands
 */
router.get('/commands', authenticateUser, (req, res) => {
  const commands = Object.keys(commandService.commands).map(cmd => ({
    command: cmd,
    description: getCommandDescription(cmd),
  }));

  res.json({
    success: true,
    commands,
  });
});

/**
 * POST /api/chat/command
 * Execute a specific command directly
 */
router.post('/command', authenticateUser, async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Command is required',
      });
    }

    if (!commandService.isCommand(command)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid command',
        availableCommands: Object.keys(commandService.commands),
      });
    }

    const commandName = commandService.extractCommand(command);
    const commandResponse = await commandService.processCommand(commandName, req.user);

    // Log command usage
    console.log(`✅ Direct command executed: ${commandName} by ${req.user.email}`);

    res.json({
      success: true,
      command: commandName,
      response: commandResponse,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Direct command error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to execute command',
    });
  }
});

/**
 * GET /api/chat/status
 * Get chat service status
 */
router.get('/status', async (req, res) => {
  try {
    const openRouterStatus = await openRouterService.validateApiKey();

    res.json({
      success: true,
      services: {
        openRouter: {
          status: openRouterStatus ? 'connected' : 'disconnected',
          message: openRouterStatus ? 'API key valid' : 'Invalid API key',
        },
      },
      commands: {
        available: Object.keys(commandService.commands).length,
        list: Object.keys(commandService.commands),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check service status',
    });
  }
});

// Helper function to get command descriptions
function getCommandDescription(command) {
  const descriptions = {
    '/misi': 'Tampilkan misi aktif yang bisa dikerjakan',
    '/poinku': 'Cek total poin dan progress kamu',
    '/tierku': 'Lihat tier dan benefit saat ini',
    '/faq': 'Pertanyaan yang sering diajukan',
    '/upgrade': 'Info cara naik ke tier berikutnya',
    '/hubungiadmin': 'Cara menghubungi admin HPZ',
  };

  return descriptions[command] || 'Perintah tidak diketahui';
}

export default router;