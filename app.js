require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const port = 3000 || process.env.PORT;

const app =  express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URL);

const itemsSchema = new mongoose.Schema({
    name: String
})

const Item = mongoose.model("item", itemsSchema); 

const item1 = new Item({
    name: "Welcome to your todolist!"
})

const item2 = new Item({
    name: "Hit the + button to add a new items."
})

const item3 = new Item({
    name: "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
})

const List = mongoose.model("list",listSchema)

app.get("/", function(req, res){

    Item.find({}).then((foundItem) => {
        if (foundItem.length === 0) {
            Item.insertMany(defaultItems).catch(function(err){
                if(err) {
                    console.log(err);
                } else {
                    console.log("Successfully default items to DB.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItem});
        }
    }).catch((err) => { 
        console.log(err);
    });
})

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    if(customListName === "About") {
        res.render("about");
    } else {
        List.findOne({name: customListName}).then((foundList) => {
            if (foundList) {
                //Show an exiting list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            } else {
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
    
                list.save();
                res.redirect("/" + customListName);
            }
        }).catch((err) => {
            console.log(err);
        })
    }
})


app.post("/",function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}).then((foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName)
        }).catch((err) => {console.log(err)});
    }

})


app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndDelete(checkedItemId).then(() => {
            console.log("Successfully deleted the checked item.");
            res.redirect("/");
        }).catch((err) => {console.log(err)});
    } else {
        List.findOne({name: listName}).then((foundList) => {
            foundList.items.pull(checkedItemId);
            foundList.save();
            res.redirect("/" + listName);
        }).catch((err) => {console.log(err)});
    }
});

app.listen(port, function(){
    console.log("Server started on port " + port);
    console.log(date.getDate());
})