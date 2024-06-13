const mongoose = require('mongoose')

const categorySchema = mongoose.Schema({

    categoryName:{
        type: String,
        required:true
    },
    description:{
        type:String,
        required:true
    }
})

const Category = mongoose.model('category', categorySchema)

module.exports = Category