import { Router } from 'express';
import { suppliersController } from './suppliers.controller';

const router = Router();

router.get('/', suppliersController.getSuppliers.bind(suppliersController));
router.post('/', suppliersController.createSupplier.bind(suppliersController));

export { router as suppliersRouter };
