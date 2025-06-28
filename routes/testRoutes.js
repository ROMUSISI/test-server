const express = require('express');

const router = express.Router();

router.get('/servertest', (req, res) => {
  return res.status(200).json({
    result: 'Server is running well'
  })
});

module.exports = router;