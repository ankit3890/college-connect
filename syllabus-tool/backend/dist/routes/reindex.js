"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// rebuild index
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/reindex', (req, res) => {
    res.send('Reindex endpoint');
});
exports.default = router;
