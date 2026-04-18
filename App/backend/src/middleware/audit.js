const { logAction } = require("../utils/auditLogger");

module.exports = (action, entity) => {
  return async (req, res, next) => {
    const originalSend = res.json;

    res.json = function (data) {
      logAction({
        user: req.user,
        action,
        entity,
        entityId: req.params.id || null,
        metadata: { body: req.body },
        req,
      });

      return originalSend.call(this, data);
    };

    next();
  };
};