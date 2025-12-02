"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// search endpoint (q, code, page, filters)
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/search', (req, res) => {
    res.send('Search endpoint');
});
exports.default = router;
