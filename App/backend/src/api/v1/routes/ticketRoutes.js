const router = require('express').Router();
const controller = require('../controllers/ticketController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
} = require('../validators/ticketValidator');

router.use(auth);

router.get('/', controller.getTickets);
router.get('/:id', controller.getTicket);

router.post('/', controller.createTicket);
router.put('/:id', validate(updateTicketSchema), controller.updateTicket);
router.post('/:id/comments', controller.addComment);
router.get('/:id/comments', controller.getComments);

router.patch('/:id/assign', validate(assignTicketSchema), controller.assignTicket);

module.exports = router;