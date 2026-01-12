import mongoose from 'mongoose';

const connect_me = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now },
});

const heyDb = mongoose.connection.useDb('heycloudream');
export default heyDb.model('connect_me', connect_me, 'connect_me');