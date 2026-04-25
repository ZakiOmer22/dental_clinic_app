const ticketService = require('../../../services/ticketService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class TicketController {
    addComment = asyncHandler(async (req, res) => {
    return successResponse(res, { comment: { id: Date.now(), text: req.body.text, created_at: new Date() } }, 'Comment added', 201);
  });

  getComments = asyncHandler(async (req, res) => {
    return successResponse(res, { comments: [] });
  });
  
  /**
   * Get tickets
   */
  getTickets = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      priority: req.query.priority,
      assignedTo: req.query.assignedTo ? parseInt(req.query.assignedTo) : undefined,
    };

    const result = await ticketService.getTickets(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.tickets,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single ticket
   */
  getTicket = asyncHandler(async (req, res) => {
    const ticket = await ticketService.getTicketById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'ticket',
      entityId: ticket.id,
      req,
    }).catch(() => {});

    return successResponse(res, { ticket });
  });

  /**
   * Create ticket
   */
   createTicket = asyncHandler(async (req, res) => {
    const ticket = await ticketService.createTicket(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, { ticket }, 'Ticket created', 201);
  });

  /**
   * Update ticket
   */
  updateTicket = asyncHandler(async (req, res) => {
    const oldTicket = await ticketService.getTicketById(req.params.id, req.user.clinicId);

    const ticket = await ticketService.updateTicket(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'ticket',
      entityId: ticket.id,
      oldData: oldTicket,
      newData: ticket,
      req,
    }).catch(() => {});

    return successResponse(res, { ticket }, 'Ticket updated');
  });

  /**
   * Assign ticket
   */
  assignTicket = asyncHandler(async (req, res) => {
    const { assignedTo } = req.body;

    const ticket = await ticketService.assignTicket(
      req.params.id,
      assignedTo,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, { ticket }, 'Ticket assigned');
  });
}

module.exports = new TicketController();