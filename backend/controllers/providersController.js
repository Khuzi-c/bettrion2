const jsonService = require('../services/jsonService');

const FILENAME = 'providers.json';

const providersController = {
    getAll: (req, res) => {
        const providers = jsonService.loadJson(FILENAME);
        res.json(providers);
    },

    getOne: (req, res) => {
        const providers = jsonService.loadJson(FILENAME);
        const provider = providers.find(p => p.id === req.params.id);
        if (!provider) return res.status(404).json({ message: 'Provider not found' });
        res.json(provider);
    },

    create: (req, res) => {
        const providers = jsonService.loadJson(FILENAME);
        const newProvider = {
            id: jsonService.generateId(),
            ...req.body,
            created_at: new Date().toISOString()
        };
        providers.push(newProvider);
        jsonService.saveJson(FILENAME, providers);
        res.status(201).json(newProvider);
    },

    update: (req, res) => {
        const providers = jsonService.loadJson(FILENAME);
        const index = providers.findIndex(p => p.id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Provider not found' });

        providers[index] = { ...providers[index], ...req.body };
        jsonService.saveJson(FILENAME, providers);
        res.json(providers[index]);
    },

    delete: (req, res) => {
        let providers = jsonService.loadJson(FILENAME);
        providers = providers.filter(p => p.id !== req.params.id);
        jsonService.saveJson(FILENAME, providers);
        res.json({ message: 'Deleted successfully' });
    }
};

module.exports = providersController;
