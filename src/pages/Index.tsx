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
} from "lucide-react";

import SalesTracker from "@/components/SalesTracker";
import InventoryManager from "@/components/InventoryManager";
import VendorManager from "@/components/VendorManager";
import CustomerManager from "@/components/CustomerManager";
import InvoiceManager from "@/components/InvoiceManager";
import ProfitLossTracker from "@/components/ProfitLossTracker";
import ProductManager from "@/components/ProductManager";
import WholesalePurchaseManager from "@/components/WholesalePurchaseManager";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardStats, setDashboardStats] = useState({
    totalSales: 0,
    todaySales: 0,
    lowStock: 0,
    pendingPayments: 0,
    profit: 0,
    customers: 0,
  });
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      const token = "2418fedd927fddbd0a1de8c5f2b106a7b0315a2d";
      const headers = {
        Authorization: `Token ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      try {
        // Fetch products
        const productsResponse = await fetch(
          "https://pabnabazar.live/api/products/",
          { headers }
        );
        const products = await productsResponse.json();

        // Fetch customers
        const customersResponse = await fetch(
          "https://pabnabazar.live/api/customers/",
          { headers }
        );
        const customers = await customersResponse.json();

        // Fetch sales
        const salesResponse = await fetch(
          "https://pabnabazar.live/api/sales/",
          { headers }
        );
        const sales = await salesResponse.json();

        // Fetch payments
        const paymentsResponse = await fetch(
          "https://pabnabazar.live/api/payments/",
          { headers }
        );
        const payments = await paymentsResponse.json();

        // Fetch wholesale purchases
        const purchasesResponse = await fetch(
          "https://pabnabazar.live/api/wholesalepurchases/",
          { headers }
        );
        const purchases = await purchasesResponse.json();

        // Compute dashboardStats
        const currentDate = new Date();
        const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

        const totalSales = sales.reduce((sum, sale) => sum + (sale.quantity * parseFloat(sale.sale_price || 0)), 0);
        const todaySales = sales.filter(sale => sale.sale_date === today).reduce((sum, sale) => sum + (sale.quantity * parseFloat(sale.sale_price || 0)), 0);
        const lowStock = products.filter(product => product.stock_quantity < 10).length;
        const pendingPayments = payments.filter(payment => payment.status === 'pending' || payment.status === 'overdue').reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
        const totalCosts = purchases.reduce((sum, purchase) => sum + (purchase.quantity * parseFloat(purchase.cost_per_unit || 0)), 0);
        const profit = totalSales - totalCosts;
        const customersCount = customers.length;

        setDashboardStats({
          totalSales,
          todaySales,
          lowStock,
          pendingPayments,
          profit,
          customers: customersCount,
        });

        // Product map
        const productMap = products.reduce((map, product) => {
          map[product.id] = product.name;
          return map;
        }, {});

        // Top products
        const productAggregates = sales.reduce((agg, sale) => {
          const prodId = sale.product;
          if (!agg[prodId]) {
            agg[prodId] = {
              name: productMap[prodId] || 'Unknown',
              sold: 0,
              revenue: 0,
            };
          }
          agg[prodId].sold += sale.quantity;
          agg[prodId].revenue += sale.quantity * parseFloat(sale.sale_price || 0);
          return agg;
        }, {});

        const sortedTopProducts = Object.values(productAggregates)
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 4);

        setTopProducts(sortedTopProducts);

        // Customer map
        const customerMap = customers.reduce((map, cust) => {
          map[cust.id] = cust.name;
          return map;
        }, {});

        // Recent sales
        const sortedSales = [...sales].sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date)).slice(0, 4);
        const recent = sortedSales.map(sale => ({
          id: `INV-${String(sale.id).padStart(3, '0')}`,
          customer: customerMap[sale.customer] || 'Unknown',
          amount: sale.quantity * parseFloat(sale.sale_price || 0),
          date: sale.sale_date,
          status: sale.status || 'paid',
        }));

        setRecentSales(recent);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Tessta Tea Management
              </h1>
              <p className="text-muted-foreground">
                Complete business management solution
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button size="sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                Quick Sale
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ৳{dashboardStats.totalSales.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ৳{dashboardStats.todaySales.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">+12% from yesterday</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {dashboardStats.lowStock}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Needs immediate attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ৳{dashboardStats.pendingPayments.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From {dashboardStats.customers} customers
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Products and Recent Sales */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Best performers this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sold} units sold
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ৳{product.revenue.toLocaleString()}
                        </p>
                        <Progress
                          value={(product.sold / 150) * 100}
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>Latest transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{sale.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {sale.customer}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-medium">
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
                            className="text-xs"
                          >
                            {sale.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                <WholesalePurchaseManager /> {/* Added here */}
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
    </div>
  );
};

export default Index;