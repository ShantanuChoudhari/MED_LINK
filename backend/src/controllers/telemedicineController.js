// src/controllers/telemedicineController.js
const crypto = require('crypto');

// POST /api/v1/telemedicine/start
exports.startCall = async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'doctorId is required.' });
    }

    // Generate a secure random room ID for the call
    const callId  = crypto.randomBytes(8).toString('hex');
    const roomId  = `medlink-room-${callId}`;

    res.status(200).json({
      success: true,
      data: {
        callId,
        roomId,
        doctorId,
        message: 'Video call session created. Share roomId with your patient.',
        createdAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/telemedicine/room/:roomId/token
exports.getRoomToken = async (req, res) => {
  try {
    const { roomId } = req.params;
    // In production, generate a signed token for the WebRTC session
    res.status(200).json({
      success: true,
      data: {
        roomId,
        userId: req.user.id,
        token: crypto.randomBytes(16).toString('hex'),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
