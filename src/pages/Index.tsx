import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  FileText,
  PlusCircle,
  Pencil,
  Save,
} from "lucide-react";
import axios from "axios";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; // Assuming you have a UI Input component

// Assuming these components exist and are correctly imported
import SalesTracker from "@/components/SalesTracker";
import InventoryManager from "@/components/InventoryManager";
import VendorManager from "@/components/VendorManager";
import CustomerManager from "@/components/CustomerManager";
import InvoiceManager from "@/components/InvoiceManager";
import ProfitLossTracker from "@/components/ProfitLossTracker";
import ProductManager, { useLowStockProducts, Product, useProductData } from "@/components/ProductManager"; // Import Product, useLowStockProducts, and useProductData
import WholesalePurchaseManager from "@/components/WholesalePurchaseManager";

// Define interfaces for type safety
// Product interface is now imported from ProductManager.tsx
// interface Product {
//   id: number;
//   name: string;
//   stock_quantity: number;
// }

interface Customer {
  id: number;
  name: string;
}

interface Sale {
  id: number;
  product: number;
  customer: number;
  quantity: number;
  sale_price: string;
  sale_date: string;
  status?: string;
}

interface Payment {
  status: string;
  amount: string;
}

interface Purchase {
  quantity: number;
  cost_per_unit: string;
}

interface TopProduct {
  name: string;
  sold: number;
  revenue: number;
}

interface RecentSale {
  id: string;
  customer: string;
  amount: number;
  date: string;
  status: string;
}

interface DashboardStats {
  totalSales: number;
  todaySales: number;
  lowStockCount: number; // Renamed to avoid conflict with lowStockProducts array
  pendingPayments: number;
  profit: number;
  customers: number;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSales: 0,
    todaySales: 0,
    lowStockCount: 0,
    pendingPayments: 0,
    profit: 0,
    customers: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for editable title
  const [businessName, setBusinessName] = useState("Tessta Tea Management");
  const [isEditingBusinessName, setIsEditingBusinessName] = useState(false);

  // States for viewing product details
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const API_BASE_URL = "https://pabnabazar.live/api/";
  const AUTH_TOKEN = "Token 2418fedd927fddbd0a1de8c5f2b106a7b0315a2d";
  const authHeaders = {
    headers: {
      Authorization: AUTH_TOKEN,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  // Use the custom hooks from ProductManager
  const { products: allProducts, sales: allSales, isLoading: isProductsLoading, getSoldQuantity, getVendorName } = useProductData();
  const { lowStockProducts, isLoading: isLowStockLoading, refetchData: refetchProductData } = useLowStockProducts();


  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        // Fetch all product data first using the hook's internal fetch or trigger it.
        // The useProductData hook already handles its own fetching on mount.
        // We'll rely on allProducts, allSales, etc. being updated by the hook.

        const [customersRes, paymentsRes, purchasesRes] = await Promise.all([
          axios.get<Customer[]>(`${API_BASE_URL}customers/`, authHeaders),
          axios.get<Payment[]>(`${API_BASE_URL}payments/`, authHeaders),
          axios.get<Purchase[]>(`${API_BASE_URL}wholesalepurchases/`, authHeaders),
        ]);

        // Ensure data is an array, default to empty array if not
        const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
        const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
        const purchases = Array.isArray(purchasesRes.data) ? purchasesRes.data : [];

        // Compute dashboardStats
        const currentDate = new Date();
        const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

        // Safely parse numeric values and handle potential undefined/null
        const totalSales = allSales.reduce((sum, sale) => sum + (sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0) * (parseFloat(allProducts.find(p => p.id === item.product)?.retail_price || '0') || 0), 0) || 0), 0);
        const todaySales = allSales
          .filter((sale) => sale.sale_date === today)
          .reduce((sum, sale) => sum + (sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0) * (parseFloat(allProducts.find(p => p.id === item.product)?.retail_price || '0') || 0), 0) || 0), 0);

        const pendingPayments = payments
          .filter((payment) => payment.status === 'pending' || payment.status === 'overdue')
          .reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
        const totalCosts = purchases.reduce((sum, purchase) => sum + (purchase.quantity || 0) * (parseFloat(purchase.cost_per_unit) || 0), 0);
        const profit = totalSales - totalCosts;
        const customersCount = customers.length;

        setDashboardStats({
          totalSales,
          todaySales,
          lowStockCount: lowStockProducts.length, // Use the count from the hook
          pendingPayments,
          profit,
          customers: customersCount,
        });

        // Product map for top products and recent sales
        const productMap = allProducts.reduce((map, product) => {
          map[product.id] = product.name;
          return map;
        }, {} as Record<number, string>);

        // Top products
        const productAggregates = allSales.reduce((agg, sale) => {
            sale.items.forEach(item => {
                const prodId = item.product;
                if (!agg[prodId]) {
                    agg[prodId] = {
                        name: productMap[prodId] || 'Unknown',
                        sold: 0,
                        revenue: 0,
                    };
                }
                agg[prodId].sold += (item.quantity || 0);
                agg[prodId].revenue += (item.quantity || 0) * (parseFloat(allProducts.find(p => p.id === item.product)?.retail_price || '0') || 0);
            });
            return agg;
        }, {} as Record<number, TopProduct>);


        const sortedTopProducts = Object.values(productAggregates)
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 4);

        setTopProducts(sortedTopProducts);

        // Customer map
        const customerMap = customers.reduce((map, cust) => {
          map[cust.id] = cust.name;
          return map;
        }, {} as Record<number, string>);

        // Recent sales
        const sortedSales = [...allSales]
          .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
          .slice(0, 4);

        const recent = sortedSales.map((sale) => ({
          id: `INV-${String(sale.id).padStart(3, '0')}`,
          customer: customerMap[sale.customer] || 'Unknown', // Assuming sale directly has customer ID
          amount: sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0) * (parseFloat(allProducts.find(p => p.id === item.product)?.retail_price || '0') || 0), 0) || 0,
          date: sale.sale_date,
          status: sale.status || 'paid', // Default to 'paid' if status is missing
        }));


        setRecentSales(recent);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardStats({
          totalSales: 0,
          todaySales: 0,
          lowStockCount: 0,
          pendingPayments: 0,
          profit: 0,
          customers: 0,
        });
        setTopProducts([]);
        setRecentSales([]);
      } finally {
        setIsLoading(false);
      }
    }

    // This effect now depends on allProducts and allSales from useProductData
    // and lowStockProducts from useLowStockProducts.
    // When those hooks update their states, this effect will re-run to compute dashboard stats.
    if (!isProductsLoading && !isLowStockLoading) {
      fetchDashboardData();
    }
  }, [allProducts, allSales, lowStockProducts, isProductsLoading, isLowStockLoading, getSoldQuantity]);

  // Function to handle saving the business name (locally)
  const handleSaveBusinessName = () => {
    setIsEditingBusinessName(false);
    // In a real application, you might save to localStorage or a global state here
  };

  const handleViewProduct = (product: Product) => {
    setViewProduct(product);
    setIsViewDialogOpen(true);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2"> {/* Flex container for title and buttons */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                {isEditingBusinessName ? (
                  <Input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-auto h-8 text-xl sm:text-2xl lg:text-3xl"
                  />
                ) : (
                  <span>{businessName}</span>
                )}
              </h1>
              {isEditingBusinessName ? (
                <Button variant="ghost" size="sm" onClick={handleSaveBusinessName} className="flex items-center gap-1">
                  <Save className="w-4 h-4" /> Save
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setIsEditingBusinessName(true)} className="flex items-center gap-1">
                  <Pencil className="w-4 h-4" /> Change
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                Export Report
              </Button>
              <Button size="sm" className="w-full sm:w-auto flex items-center gap-2">
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Quick Sale
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 w-full">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="sales" className="text-xs sm:text-sm">Sales</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs sm:text-sm">Inventory</TabsTrigger>
            <TabsTrigger value="vendors" className="text-xs sm:text-sm">Vendors</TabsTrigger>
            <TabsTrigger value="customers" className="text-xs sm:text-sm">Customers</TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm">Products</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs sm:text-sm">Financial</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {isLoading || isProductsLoading || isLowStockLoading ? (
              <div className="text-center text-sm sm:text-base">Loading dashboard data...</div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-white shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-2xl font-bold">
                        ৳{dashboardStats.totalSales.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        +20.1% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-2xl font-bold">
                        ৳{dashboardStats.todaySales.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">+12% from yesterday</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-2xl font-bold text-destructive">
                        {dashboardStats.lowStockCount}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Needs immediate attention
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <TooltipProvider>
                          {lowStockProducts.length > 0 ? (
                            lowStockProducts.map((prod) => {
                              const sold = getSoldQuantity(prod.id);
                              const effectiveStock = prod.stock_quantity - sold;
                              return (
                                <Tooltip key={prod.id}>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => handleViewProduct(prod)} className="text-xs sm:text-sm">
                                      {prod.name}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Current Stock: {effectiveStock}</p>
                                    <p>Units Sold: {sold}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })
                          ) : (
                            <div className="text-xs sm:text-sm text-muted-foreground">No low stock products</div>
                          )}
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-2xl font-bold">
                        ৳{dashboardStats.pendingPayments.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        From {dashboardStats.customers} customers
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Products and Recent Sales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white shadow">
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Top Selling Products</CardTitle>
                      <CardDescription className="text-sm sm:text-base">Best performers this month</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {topProducts.length > 0 ? (
                        topProducts.map((product, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm sm:text-base font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.sold} units sold
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm sm:text-base font-medium">
                                ৳{product.revenue.toLocaleString()}
                              </p>
                              <Progress
                                value={(product.sold / Math.max(...topProducts.map(p => p.sold))) * 100} // Dynamic max value
                                className="w-16 sm:w-20 h-2"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No top products available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow">
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Recent Sales</CardTitle>
                      <CardDescription className="text-sm sm:text-base">Latest transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentSales.length > 0 ? (
                          recentSales.map((sale) => (
                            <div
                              key={sale.id}
                              className="flex items-center justify-between"
                            >
                              <div className="space-y-1">
                                <p className="text-sm sm:text-base font-medium">{sale.id}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sale.customer}
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-sm sm:text-base font-medium">
                                  ৳{sale.amount.toLocaleString()}
                                </p>
                                <Badge
                                  variant={
                                    sale.status === "paid"
                                      ? "default"
                                      : sale.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="text-xs sm:text-sm"
                                >
                                  {sale.status}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No recent sales available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Sales */}
          <TabsContent value="sales">
            <SalesTracker />
          </TabsContent>

          {/* Inventory */}
          <TabsContent value="inventory">
            <InventoryManager />
          </TabsContent>

          {/* Vendors */}
          <TabsContent value="vendors">
            <VendorManager />
          </TabsContent>

          {/* Customers */}
          <TabsContent value="customers">
            <CustomerManager />
          </TabsContent>

          {/* Products */}
          <TabsContent value="products">
            <div className="space-y-6">
              <ProductManager />
              <div className="mt-6">
                <WholesalePurchaseManager />
              </div>
            </div>
          </TabsContent>

          {/* Financial */}
          <TabsContent value="financial">
            <div className="space-y-6">
              <InvoiceManager />
              <ProfitLossTracker />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product View Dialog (for dashboard low stock items) */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Product Details</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">Details of the product</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewProduct ? (
              <div className="space-y-2 text-sm sm:text-base">
                <div><strong>ID:</strong> {viewProduct.id}</div>
                <div><strong>Name:</strong> {viewProduct.name}</div>
                <div><strong>Current Stock:</strong> {viewProduct.stock_quantity - getSoldQuantity(viewProduct.id)}</div>
                <div><strong>Initial Stock (In the beginning):</strong> {viewProduct.stock_quantity}</div>
                <div><strong>Total Units Sold:</strong> {getSoldQuantity(viewProduct.id)}</div>
                <hr className="my-2"/>
                <div><strong>Description:</strong> {viewProduct.description}</div>
                <div><strong>Retail Price:</strong> ৳{viewProduct.retail_price}</div>
                <div><strong>Wholesale Cost:</strong> ৳{viewProduct.wholesale_cost}</div>
                <div><strong>Min Stock Level:</strong> {viewProduct.min_stock}</div>
                <div><strong>Max Stock Level:</strong> {viewProduct.max_stock}</div>
                <div><strong>Vendor:</strong> {getVendorName(viewProduct)}</div>
              </div>
            ) : (
              <div className="text-sm sm:text-base">No details available</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;