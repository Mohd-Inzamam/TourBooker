const express = require('express');
const {
  approveOperator,
  getAllUsers,
  deactivateUser,
  removeTour,
  getAllOperators,
  getUserDetail,
  getOperatorDetail,
  promoteToAdmin,
  getAdminLogs
} = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

const router = express.Router();

// Strict boundary enforcement locking routing dynamically to Admins
router.use(protect);
router.use(authorizeRoles('admin'));

// Audit Logs
router.get('/logs', getAdminLogs);

// Operator mappings
router.get('/operators', getAllOperators);
router.get('/operators/:id', getOperatorDetail);
router.put('/approve-operator/:id', approveOperator);

// User mappings
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/deactivate', deactivateUser);
router.post('/users/:id/promote', promoteToAdmin);

// Tour mappings
router.put('/tours/:id/remove', removeTour);

module.exports = router;
