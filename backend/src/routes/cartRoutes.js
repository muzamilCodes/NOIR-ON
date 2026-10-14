const router = require('express').Router();
const { getCart, addItem, removeItem, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getCart);
router.post('/', addItem);
router.delete('/:productId', removeItem);
router.delete('/', clearCart);

module.exports = router;
