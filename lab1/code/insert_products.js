//An array of products to insert
let products = require("./public/json/products.json");
const mc = require("mongodb").MongoClient;

//This gives you a 'client' object that you can use to interact with the database
mc.connect("mongodb://localhost:27017/", function (err, client) {
  if (err) throw err;
  console.log("Connected to database.");

  //Select the database by name
  let db = client.db("store");

  //issue commands to the database object
  db.collection("products").insertMany(products, function (err, result) {
    if (err) throw err;

    console.log(result);

    //Close the client connection
    client.close();
  });
});
