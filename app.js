import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import indexRouter from './routes/index';
import usersRouter from './routes/users';
import { sequelize, Sequelize } from './models'
import sequelizeHandler from './core/handlers/sequelize-error-handler';

const app = express();

sequelize.sync();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
app.use('/users', usersRouter);
app.use((req, res, next) => {
    res.status(404).send("Sorry can't find shit!")
})
app.use(sequelizeHandler)
app.use((err, req, res, next) => {
    res.status(500).send("Interal Server Error.")
})
module.exports = app;
