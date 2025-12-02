// handles PDF upload + parsing + indexing
import { Router } from 'express';
const router = Router();

router.post('/upload', (req, res) => {
    res.send('Upload endpoint');
});

export default router;
