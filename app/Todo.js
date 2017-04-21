var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var TodoSchema   = new Schema({
    name: String,
    desc: String,
    done: Boolean,
    owner: String,
    public: Boolean,
    ownerName: String
});

module.exports = mongoose.model('Todo', TodoSchema);