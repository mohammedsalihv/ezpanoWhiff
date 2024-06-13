const Category = require('../models/category')
const User = require("../models/userDB")
const Product = require('../models/productDB')



// CATEGORY MANAGEMENT


const categoryManagement = async (req, res) => {
    try {

        if (req.session.admin) {
            const categories = await Category.find({}).lean()
            if (categories) {
                res.render('admin/categoryPage', { categories })

            } else {
                res.render('admin/categoryPage', { noCategory: 'Category not available' })
            }
        } else {
            res.render('admin/adminLogin')
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    }
}


//GET


const addCategory = async (req, res) => {

       try {
        
          if(!req.session.user){
           res.redirect('/admin/adminLogout')
           }

           const catogeries = await Category.find({}).lean()
           if (catogeries) {
            res.render('admin/categoryPage', { categories })
   
           } else {
            res.render('admin/categoryPage', { noCategory: 'Category not available' })
           }
    
       } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
       }
}


//POST


const newCategory = async (req, res) => {
    try {

        if (req.session.admin) {

            const { categoryName, categoryDescription } = req.body || {};
          
            const normalizedCategoryName = categoryName.toLowerCase();

            const isExisted = await Category.findOne({ categoryName: normalizedCategoryName });
            console.log('Category Exists:', isExisted);

            if (isExisted) {
                console.log('Category already exists');
                const categories = await Category.find({}).lean();
                if (categories) {
                    res.render('admin/categoryPage', { categories, categoryUnique: 'Name must be unique' });
                }
            } else {
                console.log('Creating new category');

                const newCategory = new Category({
                    categoryName: normalizedCategoryName,
                    description: categoryDescription
                });

                await newCategory.save();
                const categories = await Category.find({}).lean();
                if (categories) {
                    res.render('admin/categoryPage', { categories, succMsg: 'Added successfully' });
                }
            }

        } else {
            res.redirect('/admin/adminLogout')
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error while adding the new category');
    }
}



//GET

const editCategory = async (req, res) => {
    try {
        if (req.session.admin) {
            const categoryId = req.params.id
            const categoryData = await Category.findById({ _id: req.params.id }).lean()

            if (categoryData) {
                res.render('admin/categoryEdit', { categoryId  , categoryData})
            }

        } else {
            res.redirect('/admin/adminLogout')
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error');
    }
}



//POST

const updateCategory = async (req, res) => {

    try {

        if (!req.session.admin) {

            res.redirect('/')
        }


        const { categoryName, categoryDescription } = req.body || {};

        const normalizedCategoryName = categoryName.toLowerCase()
        await Category.updateOne({ _id: req.params.id },
            {
                $set: {
                    categoryName: normalizedCategoryName,
                    description: categoryDescription
                }
            })

        const categories = await Category.find({}).lean()
        if (categories) {
            res.render('admin/categoryPage', { categories, updateMsg: 'Added successfully' })
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    }

}


//GET

const deleteCategory = async (req, res) => {

    try {

        if (req.session.admin) {

            await Category.deleteOne({ _id: req.params.id })

            res.redirect('/admin/categoryManagement')

        } else {
            res.redirect('/admin/adminLogout')
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error while deleting the catogery');
    }
}




module.exports = {
    categoryManagement,
    addCategory,
    newCategory,
    editCategory,
    updateCategory,
    deleteCategory,
    
}




