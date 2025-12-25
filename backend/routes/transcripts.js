const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Serve ticket transcript
router.get('/tickets/transcripts/:ticketId', (req, res) => {
    const { ticketId } = req.params;
    const filePath = path.join(__dirname, '../../frontend/tickets/transcripts', `${ticketId}.html`);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Transcript not found');
    }
});

module.exports = router;
