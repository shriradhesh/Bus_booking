
const mongoose = require('mongoose')
// mongodb://127.0.0.1:27017/book_tickit
mongoose.connect('mongodb+srv://mobappssolutions181:root123@cluster0.ro8e4sn.mongodb.net/test', {
// mongoose.connect('mongodb://127.0.0.1:27017/book_tickit', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// mongodb+srv://mobappssolutions181:mcXmVuuHUxqV9FvL@cluster0.zkghqdw.mongodb.net/book_tickit
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
})

module.exports = db