if (process.env.NODE_ENV === 'production') {
  module.exports = require('./configureStore.prod.jsx');
} else {
  module.exports = require('./configureStore.dev.jsx');
}
