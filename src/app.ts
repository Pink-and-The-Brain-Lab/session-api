import "reflect-metadata";
import express from "express";
import './database';
import cors from 'cors';
const app = express();
app.use(express.json());
app.use(cors());
export default app;
