import Router from 'express'
import { login } from '../Controllers/loginAuth.mjs'
import { verifyToken } from '../middleware/auth.mjs';





const router = Router();





router.post('/api/auth/login', login);


export default router;


