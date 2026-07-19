const categoryController = require('../controllers/CategoryController');

const router = require('express').Router();
router.post('/add', categoryController.createCategory);
router.get('/detail', categoryController.categoryDetail);
router.put('/update', categoryController.updateCategory);
router.delete('/delete', categoryController.deleteCategory);
router.get('/listing', categoryController.getAllCategory);
router.put('/status/change', categoryController.changeStatus);
router.get('/sub/listing', categoryController.getSubCategory);

module.exports = router;
