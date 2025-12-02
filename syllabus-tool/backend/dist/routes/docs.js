"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// fetch raw doc or page (for preview)
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/docs/:id', (req, res) => {
    res.send('Docs endpoint');
});
exports.default = router;
