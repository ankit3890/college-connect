// fetch raw doc or page (for preview)
import { Router } from 'express';
const router = Router();

router.get('/docs/:id', (req, res) => {
    res.send('Docs endpoint');
});

export default router;
