const express = require('express');
const sequelize = require('./models/index');
const userRoutes = require('./routes/user');
const app = express();
const config = require('./config');

app.use(express.json());

app.use('/healthz', async (req, res) => {
    
    if (req.method !== 'GET') {
        return res.status(405).send();  // Respond with 405 Method Not Allowed
    }
    
    try {
        await sequelize.authenticate(); 
        res.status(200).send(''); 
    } catch (error) {
        res.status(503).send('');
    }
});

app.use(userRoutes);


const PORT = config.server.port;
// Synchronize database schema
const startServer = async () => {
    try {
        await sequelize.authenticate();

        // Sync models with the database schema
        await sequelize.sync({ alter: true });

        app.listen(PORT, () => {
            console.log(`Server is up and running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

startServer();
