const { prisma } = require('../../lib/prisma');

/**
 * Search expenses with filters1111
 * @param {Object} filters - Search filters1111
 * @returns {Promise<Object>} Filtered expenses
 */
async function searchExpenses(filters = {}) {
  try {
    const filters1111 = filters.filters
    console.log('🔍 Searching expenses with filters1111:', filters1111);
    console.log('console------>filters1111.:', filters1111.search);
    
    // Build where clause
    const where = {};
    
    // Search by item name (case insensitive)
    if (filters1111.search) {
      where.itemName = {
        contains: filters1111.search,
        mode: 'insensitive'
      };
      console.log('📌 Applied search filter:', filters1111.search);
    }

    console.log('console------>where.itemName:', where);

    
    // Date range filter
    if (filters1111.startDate || filters1111.endDate) {
      where.dateTime = {};
      if (filters1111.startDate) {
        where.dateTime.gte = new Date(filters1111.startDate);
        console.log('📌 Start date:', filters1111.startDate);
      }
      if (filters1111.endDate) {
        where.dateTime.lte = new Date(filters1111.endDate);
        console.log('📌 End date:', filters1111.endDate);
      }
    }
    
    // Price filters1111 - IMPORTANT: Don't mix different price filter types
    if (filters1111.itemPrice && filters1111.operator) {
      // Operator-based filter (lessThan, greaterThan, equal)
      const price = Number(filters1111.itemPrice);
      console.log(`📌 Price operator: ${filters1111.operator} = ${price}`);
      
      switch (filters1111.operator) {
        case 'lessThan':
          where.itemPrice = { lt: price };
          break;
        case 'greaterThan':
          where.itemPrice = { gt: price };
          break;
        case 'equal':
          where.itemPrice = price;
          break;
      }
    } else if (filters1111.minPrice || filters1111.maxPrice) {
      // Range-based filter (min/max)
      where.itemPrice = {};
      if (filters1111.minPrice) {
        where.itemPrice.gte = Number(filters1111.minPrice);
        console.log('📌 Min price:', filters1111.minPrice);
      }
      if (filters1111.maxPrice) {
        where.itemPrice.lte = Number(filters1111.maxPrice);
        console.log('📌 Max price:', filters1111.maxPrice);
      }
    }
    
    // Unit filter
    if (filters1111.unit) {
      where.unit = {
        contains: filters1111.unit,
        mode: 'insensitive'
      };
      console.log('📌 Unit filter:', filters1111.unit);
    }
    
    // Capacity filter
    if (filters1111.capacity) {
      where.capacity = Number(filters1111.capacity);
      console.log('📌 Capacity filter:', filters1111.capacity);
    }
    
    // Description search
    if (filters1111.description) {
      where.description = {
        contains: filters1111.description,
        mode: 'insensitive'
      };
      console.log('📌 Description filter:', filters1111.description);
    }
    
    console.log('🔧 Final WHERE clause:', JSON.stringify(where, null, 2));
    
    // Sorting
    const orderBy = {};
    const sortField = filters1111.sortBy || 'dateTime';
    const sortOrder = filters1111.sortOrder || 'desc';
    
    const validSortFields = ['dateTime', 'itemPrice', 'itemName', 'createdAt', 'capacity'];
    if (validSortFields.includes(sortField)) {
      orderBy[sortField] = sortOrder;
    } else {
      orderBy.dateTime = 'desc';
    }
    
    console.log('📊 Sorting by:', sortField, sortOrder);
    
    // Get expenses
    const expenses = await prisma.expense.findMany({
      where,
      orderBy
    });
    
    console.log(`✅ Found ${expenses.length} expenses`);
    
    return {
      success: true,
      count: expenses.length,
      data: expenses,
      appliedfilters: filters1111,
      whereClause: where
    };
    
  } catch (error) {
    console.error('❌ Search error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

module.exports = { searchExpenses };