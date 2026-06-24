const express = require('express');
const router = express.Router();
const FavoriteController = require('../controllers/favorite.controller');

router.get('/', FavoriteController.getFavorites);
router.post('/toggle', FavoriteController.toggleFavorite);
router.get('/check/:productId', FavoriteController.checkFavorite);

module.exports = router;
