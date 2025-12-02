// search endpoint (q, code, page, filters)
import { Router } from 'express';
const router = Router();

router.get('/search', (req, res) => {
    res.send('Search endpoint');
});

export default router;
