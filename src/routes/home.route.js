const express = require('express');
const router = express.Router();
const HomeController = require('../controllers/home.controller');

router.get('/home-data', HomeController.getHomeData);

module.exports = router;
