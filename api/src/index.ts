import * as express from 'express';
import * as cors from 'cors';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as config from 'config';
import { DatabaseConnection } from './instances/sequelize';
import { adminRouter } from './routers/admin.router';

const app = express();
const api : any = config.get('APIServer');
const port = api.port || 9001;
let serving = path.join(__dirname, '/wiaas/');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(serving, { redirect: false }))
app.use('/', userRouter);
// app.use('/admin', adminRouter);
// app.use('/analytics', analyticsRouter);
// app.use('/reports', reportsRouter);
// app.use('/equipment', equipmentRouter);

// Test/Initialize connection
DatabaseConnection.db.authenticate();

app.listen(port, () => {
    console.log(`API is listening on port ${port}`)
    console.log(`App serving from ${serving}`)
})
