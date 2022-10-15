// Product json object format:
// {
//   id: Number, //unique ID for each product
//   name: String, //the name of the product
//   price: Number, //price of the product
//   dimensions: { x: Number, y: Number, z: Number}, //size dimensions of the product
//   stock: Number //the number of units in stock
//  }

const express = require("express");
const { ObjectId } = require("mongodb");
const mc = require("mongodb").MongoClient;

const app = express();

app.use(express.static("public"));
app.set("view engine", "pug");

//Automatically parse JSON data
app.use(express.json());

// Gets a list of products
app.get("/", function (req, res, next) {
  //Could use res.format here to send either JSON or HTML back to client
  db.collection("products")
    .find()
    .toArray(function (err, result) {
      if (err) {
        res.status(500).send("Error reading database.");
        return;
      }
      res.status(200);
      res.format({
        html: function () {
          res.render("index", { products: result });
        },
        json: function () {
          res.send(JSON.stringify(result));
        },
      });
    });
});

app.get("/products", function (req, res, next) {
  if (
    !req.query ||
    (req.query.name == "" && req.query.instock?.toLowerCase() !== "true")
  ) {
    res.redirect("/");
  }

  let searchQuery = {};
  if (req.query.name) {
    searchQuery["name"] = req.query.name;
  }
  if (req.query.instock?.toLowerCase() === "true") {
    searchQuery["stock"] = { $gte: 1 };
  }

  db.collection("products")
    .find(searchQuery)
    .toArray(function (err, result) {
      if (err) {
        res.status(500).send("Error reading database.");
        return;
      }
      res.status(200);
      res.format({
        html: function () {
          res.render("index", { products: result });
        },
        json: function () {
          res.send(JSON.stringify(result));
        },
      });
    });
});

app.get("/products/search", function (req, res, next) {
  let searchQuery = "?";
  if (req.query.name) {
    searchQuery += "name=" + req.query.name + "&";
  }
  if (req.query.instock) {
    searchQuery += "instock=" + req.query.instock;
  }
  res.status(200);
  res.send("/products" + searchQuery);
});

app.post("/products", function (req, res, next) {
  if (!req.body.reviews) {
    req.body.reviews = [];
  }
  let newProduct = {
    name: req.body.name,
    price: req.body.price,
    dimensions: req.body.dimensions
      ? req.body.dimensions
      : { x: "?", y: "?", z: "?" },
    stock: req.body.stock,
    reviews: req.body.reviews,
  };

  db.collection("products").insertOne(newProduct, function (err, result) {
    if (err) {
      res.status(500).send("Error adding to database.");
      return;
    }
    res.status(200);
    res.format({
      html: function () {
        res.send("product/" + result.insertedId.toString());
      },
      json: function () {
        res.send(JSON.stringify(result));
      },
    });
  });
});

app.get("/product/:id", function (req, res, next) {
  db.collection("products").findOne(
    { _id: new ObjectId(req.params.id) },
    function (err, result) {
      if (err) {
        res.status(404).send("Product not found.");
        return;
      }
      res.status(200);
      res.format({
        html: function () {
          res.render("product", { product: result });
        },
        json: function () {
          res.send(JSON.stringify(result));
        },
      });
    }
  );
});

app.post("/reviews/:id", function (req, res, next) {
  db.collection("products").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $push: { reviews: req.body.review } },
    function (err, result) {
      if (err) {
        res.status(500).send("Error adding to database.");
        return;
      }
      res.status(200);
      res.format({
        html: function () {
          res.send("/product/" + req.params.id);
        },
        json: function () {
          res.send(JSON.stringify(result));
        },
      });
    }
  );
});

app.get("/reviews/:id", function (req, res, next) {
  db.collection("products").findOne(
    { _id: new ObjectId(req.params.id) },
    function (err, result) {
      if (err) {
        res.status(500).send("Error reading database.");
        return;
      }
      if (!result.reviews || result.reviews === []) {
        res.status(404).send("Reviews for product not found.");
        return;
      }
      res.status(200);
      res.format({
        html: function () {
          res.send(JSON.stringify(result.reviews));
        },
        json: function () {
          res.send(JSON.stringify(result.reviews));
        },
      });
    }
  );
});

app.get("/orders/:id", function (req, res, next) {
  db.collection("orders").findOne(
    { _id: new ObjectId(req.params.id) },
    function (err, result) {
      if (err) {
        res.status(404).send("Order not found.");
        return;
      }
      res.status(200);
      result.products = result.products.map((id) => "/product/" + id);
      res.format({
        json: function () {
          res.send(JSON.stringify(result));
        },
      });
    }
  );
});

app.get("/orders", function (req, res, next) {
  db.collection("orders")
    .find()
    .toArray(function (err, result) {
      if (err) {
        res.status(500).send("Error reading database.");
        return;
      }
      res.status(200);
      for (let order of result) {
        order.products = order.products.map((id) => "/product/" + id);
      }
      res.format({
        json: function () {
          res.send(JSON.stringify(result));
        },
      });
    });
});

// order format
// {name: string, products: string[], count: number[]}

app.post("/orders", function (req, res, next) {
  let idArr = [];
  try {
    for (let pid of req.body.products) {
      idArr.push(ObjectId(pid));
    }
  } catch (err) {
    console.log(err);
    res.status(401).send("Invalid id");
    return;
  }
  if (!req.body.name) {
    res
      .status(409)
      .send("Missing name value on order. " + JSON.stringify(req.body));
    return;
  }

  db.collection("products")
    .find({ _id: { $in: idArr } })
    .toArray(function (err, result) {
      for (let product of result) {
        if (
          Number(product.stock) <
          Number(
            req.body.count[req.body.products.indexOf(product._id.toString())]
          )
        ) {
          res.status(409).send("Insufficient stock.");
          return;
        }
      }
      // if enough stock
      async function removeStock(product) {
        await db.collection("products").updateOne(
          { _id: product._id },
          {
            $set: {
              stock:
                Number(product.stock) -
                req.body.count[
                  req.body.products.indexOf(product._id.toString())
                ],
            },
          }
        );
      }
      for (let product of result) {
        removeStock(product);
      }
      // add to orders
      db.collection("orders").insert(
        {
          name: req.body.name,
          products: req.body.products,
          count: req.body.count,
        },
        function (err, result) {
          if (err) {
            res.status(401).send("Could not add.");
            return;
          }
          res.status(201);
          res.format({
            json: function () {
              res.send(JSON.stringify(result));
            },
          });
        }
      );
    });
});

// connecting our database.
mc.connect("mongodb://localhost:27017", function (err, client) {
  if (err) {
    console.log("Error in connecting to database");
    console.log(err);
    return;
  }

  db = client.db("store");
  app.listen(3000);
  console.log("Server running at http://localhost:3000/");
});
