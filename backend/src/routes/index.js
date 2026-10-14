const router = require('express').Router();

router.get('/health', (_req, res) => res.json({ ok: true, service: 'noireon-api' }));

router.use('/auth', require('./authRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
