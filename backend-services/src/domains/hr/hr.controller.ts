import { Request, Response } from 'express';
import { hrService } from './hr.service';

export class HrController {
    /**
     * GET /api/hr/employees
     * Returns all employees.
     */
    async getEmployees(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || 'tenant_1';
            const employees = await hrService.getEmployees(tenantId);

            const mappedEmployees = employees.map((e: any) => ({
                id: e.SK.split('#')[1],
                ...e
            }));

            res.status(200).json(mappedEmployees);
        } catch (error) {
            console.error('[HrController] Error getting employees:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }

    async createEmployee(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || (req.body.tenantId as string) || 'tenant_1';
            const payload = req.body;
            if (!payload.id) {
                res.status(400).json({ success: false, message: 'Missing id' });
                return;
            }
            const result = await hrService.createEmployee(tenantId, payload);
            res.status(200).json(result);
        } catch (error) {
            console.error('[HrController] Error creating employee:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }

    async createAttendance(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || (req.body.tenantId as string) || 'tenant_1';
            const payload = req.body;
            if (!payload.id) {
                res.status(400).json({ success: false, message: 'Missing id' });
                return;
            }
            const result = await hrService.createAttendance(tenantId, payload);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }

    async getAttendance(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.query.tenantId as string) || 'tenant_1';
            const records = await hrService.getAttendance(tenantId);
            const mapped = records.map((a: any) => ({
                id: a.attendanceId || a.SK.split('#')[1],
                ...a
            }));
            res.status(200).json(mapped);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }
}

export const hrController = new HrController();
