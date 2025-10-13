import mongoose from 'mongoose';

const CounterProdcutSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // name of the counter, e.g., 'support'
  seq: { type: Number, default: 0 },
});

const CounterProduct = mongoose.model('CounterProduct', CounterProdcutSchema);
export default CounterProduct;
