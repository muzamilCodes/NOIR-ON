const router = require('express').Router();
const { stats, allOrders, addProduct, deleteProduct } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/stats', stats);
router.get('/orders', allOrders);
router.post('/products', addProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
