const router = require('express').Router();
const {
  stats,
  allOrders,
  updateOrderStatus,
  listUsers,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/upload');

router.use(protect, adminOnly);
router.get('/stats', stats);
router.get('/orders', allOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/users', listUsers);
router.post('/upload', upload.single('image'), uploadImage);
router.post('/products', addProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
