const express = require('express');
const router = express.Router();

// Feature removed in mosque prototype: dashboard & statistics
router.all('*', (req, res) => {
	res.status(410).json({ error: 'Dashboard/statistics feature removed for this prototype' });
});

module.exports = router;
