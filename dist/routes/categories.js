import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getCategories, createCategory, deleteCategory } from '../controllers/categoryController.js';
const router = Router();
router.use(authMiddleware);
router.get('/', getCategories);
router.post('/', createCategory);
router.delete('/:id', deleteCategory);
export default {
    prefix: 'v1/settings',
    router
};
