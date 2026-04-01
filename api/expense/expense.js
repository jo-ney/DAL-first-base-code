const { prisma } = require('../../lib/prisma');

/**
 * Search expenses with filters
 * @param {Object} reqBody - Request body containing search and filter
 * @returns {Promise<Object>} Filtered expenses
 */
async function searchExpenses(reqBody = {}) {
  try {
    // Extract search and filter from request body
    const search = reqBody.search || '';
    const filter = reqBody.filter || {};
    
    console.log('🔍 Searching expenses with:');
    console.log('📝 Search term:', search);
    console.log('🎯 Filter object:', filter);
    
    // Build where clause
    const where = {};
    
    // Search by item name (case insensitive)
    if (search && search.trim()) {
      where.itemName = {
        contains: search,
        mode: 'insensitive'
      };
      console.log('📌 Applied search filter:', search);
    }

    // Date range filter
    if (filter.startDate || filter.endDate) {
      where.dateTime = {};
      if (filter.startDate) {
        where.dateTime.gte = new Date(filter.startDate);
        console.log('📌 Start date:', filter.startDate);
      }
      if (filter.endDate) {
        where.dateTime.lte = new Date(filter.endDate);
        console.log('📌 End date:', filter.endDate);
      }
    }
    
    // Price filters - Operator-based (lessThan, greaterThan, equal)
    if (filter.itemPrice && filter.operator) {
      const price = Number(filter.itemPrice);
      console.log(`📌 Price operator: ${filter.operator} = ${price}`);
      
      switch (filter.operator) {
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
    } 
    // Price filters - Range-based (min/max)
    else if (filter.minPrice || filter.maxPrice) {
      where.itemPrice = {};
      if (filter.minPrice) {
        where.itemPrice.gte = Number(filter.minPrice);
        console.log('📌 Min price:', filter.minPrice);
      }
      if (filter.maxPrice) {
        where.itemPrice.lte = Number(filter.maxPrice);
        console.log('📌 Max price:', filter.maxPrice);
      }
    }
    
    // Unit filter
    if (filter.unit) {
      where.unit = {
        contains: filter.unit,
        mode: 'insensitive'
      };
      console.log('📌 Unit filter:', filter.unit);
    }
    
    // Capacity filter
    if (filter.capacity) {
      where.capacity = Number(filter.capacity);
      console.log('📌 Capacity filter:', filter.capacity);
    }
    
    // Description search
    if (filter.description) {
      where.description = {
        contains: filter.description,
        mode: 'insensitive'
      };
      console.log('📌 Description filter:', filter.description);
    }
    
    console.log('🔧 Final WHERE clause:', JSON.stringify(where, null, 2));
    
    // Skip query if no filters are applied
    if (Object.keys(where).length === 0 && !search) {
      console.log('⚠️ No filters or search applied, returning all expenses?');
      // Option 1: Return all expenses
      // Option 2: Return empty result with message
      // For now, we'll continue with empty where clause to get all records
    }
    
    // Sorting
    const orderBy = {};
    const sortField = filter.sortBy || 'dateTime';
    const sortOrder = filter.sortOrder || 'desc';
    
    const validSortFields = ['dateTime', 'itemPrice', 'itemName', 'createdAt', 'capacity'];
    if (validSortFields.includes(sortField)) {
      orderBy[sortField] = sortOrder;
    } else {
      orderBy.dateTime = 'desc';
    }
    
    console.log('📊 Sorting by:', sortField, sortOrder);
    
    // Pagination (optional)
    const skip = filter.page ? (filter.page - 1) * (filter.limit || 10) : 0;
    const take = filter.limit || 50;
    
    // Get expenses with pagination
    const expenses = await prisma.expense.findMany({
      where,
      orderBy,
      skip,
      take
    });
    
    // Get total count for pagination
    const totalCount = await prisma.expense.count({ where });
    
    console.log(`✅ Found ${expenses.length} of ${totalCount} total expenses`);
    
    return {
      data: expenses,
      success: true,
      count: expenses.length,
      total: totalCount,
      page: filter.page || 1,
      limit: filter.limit || 50,
      appliedSearch: search,
      appliedFilters: filter
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