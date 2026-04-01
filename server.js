// const express = require("express")
// const app = express()

// const port = 5000

// app.use("/ok", (req, res) => {
//     console.log("ogigdfngdfn")
//     res.status(200).json("Hi Noob")
// })

// app.listen(port, () => {
//     console.log(`DAl running on http://localhost:${port}`)
// })

const express = require("express");
const app = express();
const cors = require("cors")
const port = 5000;

// Import search function
const { searchExpenses } = require("./api/expense/expense");

app.use(cors())

app.use(express.json()); // Add this for JSON parsing

// Your existing route
app.use("/ok", (req, res) => {
    console.log("ogigdfngdfn");
    res.status(200).json("Hi Noob");
});

// NEW: Search expenses route
app.post('/api/expense/search', async (req, res) => {
    try {
      // If you're sending filters in the body
      const filters = req.body;
      console.log('Received filters:', filters);
      
      const result = await searchExpenses(filters);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Route error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  

// Search expenses route
// app.get('/api/expenses/search', async (req, res) => {
//   try {
//     const result = await searchExpenses(req.query);
    
//     if (result.success) {
//       res.status(200).json(result);
//     } else {
//       res.status(500).json(result);
//     }
//   } catch (error) {
//     console.error('❌ Route error:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       data: []
//     });
//   }
// });



app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
