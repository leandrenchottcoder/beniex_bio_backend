import mongoose from 'mongoose';

const CounterOrderSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // name of the counter, e.g., 'support'
  seq: { type: Number, default: 0 },
});

const CounterOrder = mongoose.model('CounterOrder', CounterOrderSchema);
export default CounterOrder;
