const express = require('express');

/**
 * Maps legacy route → v1 route
 */
function mapLegacyToV1(v1Route) {
  const router = express.Router();

  router.use((req, res, next) => {
    req.url = req.originalUrl.replace(/^\/[^/]+/, ''); 
    next();
  });

  router.use(v1Route);
  return router;
}

module.exports = mapLegacyToV1;