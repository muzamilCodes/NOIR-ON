const router = require('express').Router();
const { createOrder, myOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', createOrder);
router.get('/', myOrders);

module.exports = router;
