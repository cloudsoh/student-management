import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import fs from 'fs';
import util from 'util'

import indexRouter from './routes/index';
import { sequelize, Sequelize } from './models'
import sequelizeHandler from './core/handlers/sequelize-error-handler';

const app = express();

var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'a'});
    
var log_stdout = process.stdout;

console.error = function(d) { //
    const now = new Date();
    const time = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() 
    d = `[${time}]: ${d}`
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

sequelize.sync();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', indexRouter);
app.use((req, res, next) => {
    res.status(404).send("Route not found.")
})
app.use(sequelizeHandler)
app.use((err, req, res, next) => {
    console.error(err);
    if (process.env.NODE_ENV === 'production') {
        res.status(500).send("Interal Server Error.")
    } else {
        res.status(500).send(err.message)
    }
})
module.exports = app;
