// api/index.js
const express = require('express');
const cors = require('cors');
const { searchExpenses } = require('./expense/expense');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============== HEALTH CHECK ==============
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API is running'
  });
});

// ============== TEST ENDPOINT ==============
app.get("/ok", (req, res) => {
  console.log("✅ /ok endpoint accessed");
  res.status(200).json({
    success: true,
    message: "Hi Noob",
    timestamp: new Date().toISOString()
  });
});

// ============== SEARCH EXPENSES (POST) ==============
app.post('/api/expense/search', async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'EMPTY_REQUEST',
        message: 'Request body cannot be empty.',
        timestamp: new Date().toISOString()
      });
    }

    const result = await searchExpenses(req.body);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.data?.length || 0,
        appliedFilters: result.appliedFilters,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'SEARCH_FAILED',
        message: result.message || 'Failed to search expenses',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Search error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============== SEARCH EXPENSES (GET) ==============
app.get('/api/expense/search', async (req, res) => {
  try {
    const searchParams = {
      search: req.query.search || '',
      filter: {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      }
    };
    
    const result = await searchExpenses(searchParams);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.data?.length || 0,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ GET search error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============== GET ALL EXPENSES ==============
app.get('/api/expense', async (req, res) => {
  try {
    const { prisma } = require('../lib/prisma');
    
    const expenses = await prisma.expense.findMany({
      orderBy: { dateTime: 'desc' },
      take: 100
    });
    
    return res.status(200).json({
      success: true,
      data: expenses,
      count: expenses.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Get all error:', error);
    return res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============== GET EXPENSE BY ID ==============
app.get('/api/expense/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { prisma } = require('../lib/prisma');
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_ID',
        message: 'Expense ID is required.',
        timestamp: new Date().toISOString()
      });
    }
    
    const expense = await prisma.expense.findUnique({
      where: { id: id }
    });
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Expense with ID ${id} not found.`,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(200).json({
      success: true,
      data: expense,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Get by ID error:', error);
    return res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============== CREATE EXPENSE ==============
app.post('/api/expense', async (req, res) => {
  try {
    const expenseData = req.body;
    const { prisma } = require('../lib/prisma');
    
    if (!expenseData || Object.keys(expenseData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_DATA',
        message: 'Expense data is required.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate required fields
    if (!expenseData.itemName) {
      return res.status(422).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'itemName is required.',
        field: 'itemName',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!expenseData.itemPrice || expenseData.itemPrice <= 0) {
      return res.status(422).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'itemPrice must be a positive number.',
        field: 'itemPrice',
        timestamp: new Date().toISOString()
      });
    }
    
    const newExpense = await prisma.expense.create({
      data: expenseData
    });
    
    return res.status(201).json({
      success: true,
      data: newExpense,
      message: 'Expense created successfully.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Create error:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_ENTRY',
        message: 'An expense with this data already exists.',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'CREATE_FAILED',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============== UPDATE EXPENSE ==============
app.put('/api/expense/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { prisma } = require('../lib/prisma');
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_ID',
        message: 'Expense ID is required.',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_DATA',
        message: 'Update data is required.',
        timestamp: new Date().toISOString()
      });
    }
    
    const updatedExpense = await prisma.expense.update({
      where: { id: id },
      data: updateData
    });
    
    return res.status(200).json({
      success: true,
      data: updatedExpense,
      message: 'Expense updated successfully.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Update error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Expense with ID ${req.params.id} not found.`,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'UPDATE_FAILED',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============== DELETE EXPENSE ==============
app.delete('/api/expense/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { prisma } = require('../lib/prisma');
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_ID',
        message: 'Expense ID is required.',
        timestamp: new Date().toISOString()
      });
    }
    
    await prisma.expense.delete({
      where: { id: id }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.',
      deletedId: id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Expense with ID ${req.params.id} not found.`,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'DELETE_FAILED',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============== 404 HANDLER ==============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET  /api/health',
      'GET  /ok',
      'GET  /api/expense',
      'POST /api/expense/search',
      'GET  /api/expense/search',
      'GET  /api/expense/:id',
      'POST /api/expense',
      'PUT  /api/expense/:id',
      'DELETE /api/expense/:id'
    ],
    timestamp: new Date().toISOString()
  });
});

// ============== START SERVER (ONLY FOR LOCAL DEVELOPMENT) ==============
// Check if running directly (not on Vercel)
if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📝 Available endpoints:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /ok`);
    console.log(`   GET  /api/expense`);
    console.log(`   POST /api/expense/search`);
    console.log(`   GET  /api/expense/search`);
    console.log(`   GET  /api/expense/:id`);
    console.log(`   POST /api/expense`);
    console.log(`   PUT  /api/expense/:id`);
    console.log(`   DELETE /api/expense/:id`);
  });
}

// Export the app for Vercel
module.exports = app;