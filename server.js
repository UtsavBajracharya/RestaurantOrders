const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Define Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  foodOrdered: { type: String, required: true },
  date: { type: Date, required: true },
});

// Create Order model
const Order = mongoose.model("Order", orderSchema);

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/restaurant-orders", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("Connection error:", err);
    process.exit(1);
  });

// Create a new order
app.post("/orders", async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res
      .status(400)
      .json({ message: "Request body is missing or empty" });
  }

  const { orderId, firstName, lastName, quantity, price, foodOrdered, date } =
    req.body;
  try {
    const newOrder = new Order({
      orderId,
      firstName,
      lastName,
      quantity,
      price,
      foodOrdered,
      date,
    });
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Order ID already exists" });
    } else {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
});

// Get all orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get order by ID
app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (order) {
      res.status(200).json(order);
    } else {
      res
        .status(404)
        .json({ message: "The order ID was not found in database" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update an order
app.put("/orders/:id", async (req, res) => {
  const { firstName, lastName, quantity, price, foodOrdered, date } = req.body;
  try {
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      { firstName, lastName, quantity, price, foodOrdered, date },
      { new: true }
    );
    if (order) {
      res.status(200).json(order);
    } else {
      res
        .status(404)
        .json({ message: "The order ID was not found in database" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get orders by customer name
app.get("/orders/customer/:name", async (req, res) => {
  const [firstName, lastName] = req.params.name.split(" ");
  try {
    const orders = await Order.find({ firstName, lastName });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get orders by date
app.get("/orders/date/:date", async (req, res) => {
  try {
    const orders = await Order.find({ date: new Date(req.params.date) });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

//Delete orders
app.delete("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ orderId: req.params.id });
    if (order) {
      res.status(200).json({ message: "Order deleted successfully" });
    } else {
      res.status(404).json({ message: "Order ID not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
