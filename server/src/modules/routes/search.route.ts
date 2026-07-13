import { searchMemory, searchNote } from "../services/search.service";

const express = require('express');
const router = express.Router();
const app = express();

router.get('/search', async (req: any, res: any) => {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    try {
        const results = await searchNote(query, limit);
        res.json(results);
    } catch (error) {
        console.error('Error searching notes:', error);
        res.status(500).json({ error: 'An error occurred while searching notes.' });
    }
}
);

router.get('/search/memory', async (req: any, res: any) => {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    try {
        const results = await searchMemory(query, limit);
        res.json(results);
    } catch (error) {
        console.error('Error searching memory:', error);
        res.status(500).json({ error: 'An error occurred while searching memory.' });
    }
});

export default router;  