"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// handles PDF upload + parsing + indexing
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/upload', (req, res) => {
    res.send('Upload endpoint');
});
exports.default = router;
