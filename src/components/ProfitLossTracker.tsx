import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Package, Target, Download, Loader2, AlertCircle } from "lucide-react";

const API_BASE_URL = "https://pabnabazar.live/api";
const AUTH_TOKEN = "2418fedd927fddbd0a1de8c5f2b106a7b0315a2d"; // Replace with a more secure way to handle tokens in production

const ProfitLossTracker = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [profitData, setProfitData] = useState({
    totalRevenue: 0, totalCost: 0, grossProfit: 0, expenses: 0,
    netProfit: 0, profitMargin: 0, profitGrowth: 0
  });
  const [productProfitability, setProductProfitability] = useState([]);
  const [monthlyProfits, setMonthlyProfits] = useState([]);

  // Helper to get authorization headers
  const getAuthHeaders = useCallback(() => ({
    'Authorization': `Token ${AUTH_TOKEN}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }), []);

  // Fetches all necessary data from the API
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      const [salesRes, purchasesRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/sales/`, { headers }),
        fetch(`${API_BASE_URL}/wholesalepurchases/`, { headers }),
        fetch(`${API_BASE_URL}/products/`, { headers })
      ]);

      if (!salesRes.ok) throw new Error(`Failed to fetch sales: ${salesRes.statusText}`);
      if (!purchasesRes.ok) throw new Error(`Failed to fetch purchases: ${purchasesRes.statusText}`);
      if (!productsRes.ok) throw new Error(`Failed to fetch products: ${productsRes.statusText}`);

      const [salesData, purchasesData, productsData] = await Promise.all([
        salesRes.json(),
        purchasesRes.json(),
        productsRes.json()
      ]);

      // --- DEBUGGING OUTPUT ---
      console.log("Fetched Sales Data:", salesData);
      console.log("Fetched Purchases Data:", purchasesData);
      console.log("Fetched Products Data:", productsData);
      // --- END DEBUGGING OUTPUT ---

      setSales(salesData);
      setPurchases(purchasesData);
      setProducts(productsData);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "An unknown error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Filters data based on the selected period
  const filterByPeriod = useCallback((data, period, dateField = 'sale_date') => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (period === 'all') {
      return data; // Return all data for "All Time"
    }

    return data.filter(item => {
      if (!item[dateField]) return false; // Ensure date field exists
      const itemDate = new Date(item[dateField]);

      if (isNaN(itemDate.getTime())) { // Check for invalid date
        console.warn(`Invalid date encountered for ${dateField}:`, item[dateField]);
        return false;
      }

      switch (period) {
        case 'current-month':
          return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        case 'last-month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
        case 'quarter':
          const currentQuarter = Math.floor(currentMonth / 3);
          const itemQuarter = Math.floor(itemDate.getMonth() / 3);
          return itemQuarter === currentQuarter && itemDate.getFullYear() === currentYear;
        case 'year':
          return itemDate.getFullYear() === currentYear;
        default:
          return true;
      }
    });
  }, []);

  // Calculates profitability metrics
  const calculateMetrics = useCallback(() => {
    // Only calculate if not loading and initial data is present
    if (loading) { // Wait until loading is complete
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filteredSales = filterByPeriod(sales, selectedPeriod);
    const filteredPurchases = filterByPeriod(purchases, selectedPeriod, 'purchase_date');

    // --- DEBUGGING OUTPUT ---
    console.log(`Filtered Sales for ${selectedPeriod}:`, filteredSales);
    console.log(`Filtered Purchases for ${selectedPeriod}:`, filteredPurchases);
    // --- END DEBUGGING OUTPUT ---

    const totalRevenue = filteredSales.reduce((sum, sale) =>
      sum + parseFloat(sale.total_amount || 0), 0);

    const totalCost = filteredPurchases.reduce((sum, purchase) =>
      sum + (parseFloat(purchase.cost_per_unit || 0) * parseInt(purchase.quantity || 0)), 0);

    // Assuming a fixed 10% for operating expenses for simplicity
    const expenses = totalRevenue * 0.10;
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - expenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Calculate previous month's profit for growth comparison
    const previousMonthSales = filterByPeriod(sales, 'last-month');
    const previousMonthPurchases = filterByPeriod(purchases, 'last-month', 'purchase_date');

    const prevRevenue = previousMonthSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
    const prevCost = previousMonthPurchases.reduce((sum, p) =>
      sum + (parseFloat(p.cost_per_unit || 0) * parseInt(p.quantity || 0)), 0);
    const prevExpenses = prevRevenue * 0.10;
    const previousMonthProfit = prevRevenue - prevCost - prevExpenses;

    let profitGrowth = 0;
    if (previousMonthProfit !== 0) {
      profitGrowth = ((netProfit - previousMonthProfit) / Math.abs(previousMonthProfit)) * 100;
    } else if (netProfit > 0) {
      profitGrowth = 100; // If previous was 0 and current is positive, consider it 100% growth
    }

    setProfitData({ totalRevenue, totalCost, grossProfit, expenses, netProfit, profitMargin, profitGrowth });
    calculateProductProfitability(filteredSales, filteredPurchases);
    calculateMonthlyTrends();
  }, [sales, purchases, products, selectedPeriod, filterByPeriod, loading]);

  // Calculates profitability per product
  const calculateProductProfitability = useCallback((filteredSales, filteredPurchases) => {
    const productStats = {};

    // Aggregate sales data
    filteredSales.forEach(sale => {
      // Ensure sale.items is an array before iterating
      if (Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const productId = item.product; // Assuming item.product directly holds product ID
          if (!productStats[productId]) {
            productStats[productId] = { productId, revenue: 0, cost: 0, unitsSold: 0 };
          }
          productStats[productId].revenue += parseFloat(item.line_total || 0);
          productStats[productId].unitsSold += parseInt(item.quantity || 0);
        });
      }
    });

    // Aggregate purchase data
    filteredPurchases.forEach(purchase => {
      const productId = purchase.product; // Assuming purchase.product directly holds product ID
      if (!productStats[productId]) {
        productStats[productId] = { productId, revenue: 0, cost: 0, unitsSold: 0 };
      }
      productStats[productId].cost += parseFloat(purchase.cost_per_unit || 0) * parseInt(purchase.quantity || 0);
    });

    // Map stats to final profitability array
    const profitability = Object.values(productStats).map(stat => {
      const product = products.find(p => p.id === stat.productId);
      const profit = stat.revenue - stat.cost;
      const margin = stat.revenue > 0 ? (profit / stat.revenue) * 100 : 0;
      return {
        product: product?.name || `Product ${stat.productId}`, // Fallback if product name not found
        revenue: stat.revenue, cost: stat.cost, profit, margin, unitsSold: stat.unitsSold
      };
    }).sort((a, b) => b.profit - a.profit).slice(0, 10); // Top 10 most profitable products
    setProductProfitability(profitability);
  }, [products]);

  // Calculates monthly profit trends
  const calculateMonthlyTrends = useCallback(() => {
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Process sales for monthly revenue
    sales.forEach(sale => {
      const date = new Date(sale.sale_date);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${months[month]} ${year}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, revenue: 0, cost: 0, date: new Date(year, month, 1) };
      }
      monthlyData[monthKey].revenue += parseFloat(sale.total_amount || 0);
    });

    // Process purchases for monthly cost
    purchases.forEach(purchase => {
      const date = new Date(purchase.purchase_date);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${months[month]} ${year}`;

      // Ensure that if a month only has purchases but no sales, it still gets an entry
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, revenue: 0, cost: 0, date: new Date(year, month, 1) };
      }
      monthlyData[monthKey].cost += parseFloat(purchase.cost_per_unit || 0) * parseInt(purchase.quantity || 0);
    });

    // Calculate profit and margin for each month
    const trends = Object.values(monthlyData)
      .map(data => {
        const expenses = data.revenue * 0.10; // Apply 10% expenses
        const profit = data.revenue - data.cost - expenses;
        const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
        return {
          month: data.month,
          revenue: data.revenue,
          cost: data.cost,
          profit,
          margin,
          date: data.date
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date descending
      .slice(0, 4); // Show last 4 months
    setMonthlyProfits(trends);
  }, [sales, purchases]);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Recalculate metrics whenever relevant data or selected period changes
  useEffect(() => {
    if (!loading) { // Only attempt calculation when not actively loading
      calculateMetrics();
    }
  }, [selectedPeriod, sales, purchases, products, loading, calculateMetrics]);

  // Handles exporting the report as a JSON file
  const handleExportReport = () => {
    const reportData = {
      period: selectedPeriod,
      summary: profitData,
      productProfitability,
      monthlyTrends: monthlyProfits,
      generatedAt: new Date().toISOString()
    };
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profit-loss-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">Loading profit & loss data...</p>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-[90vw] sm:max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              <CardTitle className="text-lg sm:text-xl">Error Loading Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAllData} className="w-full">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main component UI
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-background min-h-screen max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Profit & Loss Tracker
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">Real-time profitability analysis and reporting</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-40 text-sm sm:text-base">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportReport} className="w-full sm:w-auto flex items-center gap-2">
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">৳{profitData.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">from sales data</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">৳{profitData.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">from purchases</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {profitData.netProfit >= 0 ? <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" /> : <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />}
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ৳{profitData.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className={`flex items-center text-xs sm:text-sm ${profitData.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitData.profitGrowth >= 0 ? '+' : ''}{profitData.profitGrowth.toFixed(1)}% vs last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{profitData.profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">calculated margin</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Profit Breakdown</CardTitle>
            <CardDescription className="text-sm sm:text-base">Detailed profit analysis for {selectedPeriod.replace('-', ' ')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base font-medium">Total Revenue</span>
                <span className="text-sm sm:text-base font-bold">৳{profitData.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span className="text-sm sm:text-base">Cost of Goods Sold</span>
                <span className="text-sm sm:text-base">−৳{profitData.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-sm sm:text-base font-medium">Gross Profit</span>
                <span className="text-sm sm:text-base font-bold text-green-600">৳{profitData.grossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span className="text-sm sm:text-base">Operating Expenses (10%)</span>
                <span className="text-sm sm:text-base">−৳{profitData.expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-base sm:text-lg font-medium">Net Profit</span>
                <span className={`text-base sm:text-lg font-bold ${profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ৳{profitData.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm sm:text-base">
                <span>Profit Margin</span>
                <span>{profitData.profitMargin.toFixed(1)}%</span>
              </div>
              <Progress
                value={Math.min(Math.abs(profitData.profitMargin), 100)}
                indicatorColor={profitData.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Monthly Profit Trends</CardTitle>
            <CardDescription className="text-sm sm:text-base">Last {monthlyProfits.length} months performance</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyProfits.length > 0 ? (
              <div className="space-y-4">
                {monthlyProfits.map((month, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base font-medium">{month.month}</span>
                      <span className="text-sm sm:text-base font-bold">৳{month.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                      <span>Revenue: ৳{month.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      <span>Margin: {month.margin.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={Math.min((Math.abs(month.profit) / Math.max(1, ...monthlyProfits.map(m => Math.abs(m.profit)))) * 100, 100)}
                      indicatorColor={month.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}
                      className="h-1"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground text-center py-4">No monthly data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Product Profitability Analysis</CardTitle>
          <CardDescription className="text-sm sm:text-base">Profit analysis by product ({productProfitability.length} products displayed)</CardDescription>
        </CardHeader>
        <CardContent>
          {productProfitability.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                    <th className="text-left p-3 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Units</th>
                    <th className="text-left p-3 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Revenue</th>
                    <th className="text-left p-3 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Cost</th>
                    <th className="text-left p-3 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Profit</th>
                    <th className="text-left p-3 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Margin</th>
                    <th className="text-left p-3 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productProfitability.map((product, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="p-3 text-xs sm:text-sm font-medium">{product.product}</td>
                      <td className="p-3 text-xs sm:text-sm">{product.unitsSold}</td>
                      <td className="p-3 text-xs sm:text-sm">৳{product.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="p-3 text-xs sm:text-sm">৳{product.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className={`p-3 text-xs sm:text-sm font-medium ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ৳{product.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="p-3 text-xs sm:text-sm">
                        <Badge variant={product.margin > 30 ? 'default' : product.margin > 15 ? 'secondary' : 'destructive'}>
                          {product.margin.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="p-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min((Math.abs(product.profit) / Math.max(1, ...productProfitability.map(p => Math.abs(p.profit)))) * 100, 100)}
                            indicatorColor={product.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}
                            className="w-12 sm:w-16 h-2"
                          />
                          <span className={`text-xs sm:text-sm ${product.margin > 30 ? 'text-green-600' : product.margin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {product.margin > 30 ? 'Excellent' : product.margin > 15 ? 'Good' : 'Low'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm sm:text-base text-muted-foreground text-center py-8">No product data available for the selected period</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitLossTracker;