const expenseService = require('../../../services/expenseService');

exports.getExpenses = async (req, res) => {
  try {
    const data = await expenseService.getAll(req.user.clinicId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const data = await expenseService.getById(
      req.params.id,
      req.user.clinicId
    );
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const data = await expenseService.create(
      req.body,
      req.user.id,
      req.user.clinicId
    );
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const data = await expenseService.update(
      req.params.id,
      req.body,
      req.user.clinicId
    );
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    await expenseService.delete(
      req.params.id,
      req.user.clinicId
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};