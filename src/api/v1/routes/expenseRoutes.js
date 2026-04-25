const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseController');
const auth = require('../../../middleware/auth'); // your JWT middleware

router.use(auth);

router.get('/', controller.getExpenses);
router.get('/:id', controller.getExpense);
router.post('/', controller.createExpense);
router.put('/:id', controller.updateExpense);
router.delete('/:id', controller.deleteExpense);

module.exports = router;