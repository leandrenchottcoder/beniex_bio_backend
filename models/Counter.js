import mongoose from 'mongoose';

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // name of the counter, e.g., 'support'
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', CounterSchema);
export default Counter;
