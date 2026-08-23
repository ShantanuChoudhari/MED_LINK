// backend/src/routes/notificationRoutes.js
const express = require('express');
const router  = express.Router();
const { getNotifications, markAllRead, markRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',                protect, getNotifications);    // GET    /api/v1/notifications
router.patch('/read-all',      protect, markAllRead);         // PATCH  /api/v1/notifications/read-all
router.patch('/:id/read',      protect, markRead);            // PATCH  /api/v1/notifications/:id/read
router.delete('/:id',          protect, deleteNotification);  // DELETE /api/v1/notifications/:id

module.exports = router;
