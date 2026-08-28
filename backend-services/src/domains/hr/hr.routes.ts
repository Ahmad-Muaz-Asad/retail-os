import { Router } from 'express';
import { hrController } from './hr.controller';

const router = Router();

/**
 * GET /api/hr/employees
 * Returns all employees.
 */
router.get('/employees', (req, res) => hrController.getEmployees(req, res));
router.post('/employees', (req, res) => hrController.createEmployee(req, res));
router.post('/attendance', (req, res) => hrController.createAttendance(req, res));
router.get('/attendance', (req, res) => hrController.getAttendance(req, res));

export default router;
