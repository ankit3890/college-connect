// rebuild index
import { Router } from 'express';
const router = Router();

router.post('/reindex', (req, res) => {
    res.send('Reindex endpoint');
});

export default router;
