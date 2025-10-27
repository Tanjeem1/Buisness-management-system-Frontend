import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Search, Filter, Download, Eye, Edit, Clock, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import axios from "axios";

// Define interfaces based on your API
interface Product {
  id: number;
  name: string;
  retail_price?: string;
  price?: string;
  stock_quantity: number;
}

interface Customer {
  id: number;
  shop_name: string;
  name?: string;
}

interface SaleItem {
  product: { id: number; name: string } | number;
  quantity: number;
  unit_price: string;
  line_total: string;
}

interface Sale {
  id: number;
  sale_date?: string;
  invoice_date?: string;
  date?: string;
  created_at?: string;
  due_date?: string;
  customer: { id: number; shop_name: string } | number;
  items: SaleItem[];
  total_amount: string | number;
  status: string;
}

const SalesTracker = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newSale, setNewSale] = useState({
    customerId: "",
    productId: "",
    quantity: "",
    status: "pending",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Edit modal
  const [editSale, setEditSale] = useState<Sale | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // View modal
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const API_BASE_URL = "https://pabnabazar.live/api/";
  const AUTH_TOKEN = "Token 2418fedd927fddbd0a1de8c5f2b106a7b0315a2d";
  const authHeaders = {
    Authorization: AUTH_TOKEN,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [salesRes, productsRes, customersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}sales/`, { headers: authHeaders }),
        axios.get(`${API_BASE_URL}products/`, { headers: authHeaders }),
        axios.get(`${API_BASE_URL}customers/`, { headers: authHeaders }),
      ]);
      setSales(salesRes.data || []);
      setProducts(productsRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSelectedProduct = (productId: string) => {
    return products.find(p => p.id === parseInt(productId));
  };

  const calculateTotal = (quantity: string, productId: string) => {
    const selectedProduct = getSelectedProduct(productId);
    const price = parseFloat(selectedProduct?.retail_price || selectedProduct?.price || '0') || 0;
    const qty = parseInt(quantity) || 0;
    return price * qty;
  };

  const handleAddSale = async () => {
    if (!newSale.customerId || !newSale.productId || !newSale.quantity) {
      alert("Please fill out all fields.");
      return;
    }

    const selectedProduct = getSelectedProduct(newSale.productId);
    if (!selectedProduct) {
      alert("Selected product could not be found. Please refresh and try again.");
      return;
    }

    const quantity = parseInt(newSale.quantity) || 0;
    const unitPrice = parseFloat(selectedProduct.retail_price || selectedProduct.price || '0') || 0;
    const lineTotal = quantity * unitPrice;

    if (quantity <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const payload = {
      customer: parseInt(newSale.customerId),
      user: 1,
      sale_date: today,
      total_amount: lineTotal,
      is_paid: false,
      status: newSale.status,
      items: [
        {
          product: selectedProduct.id,
          quantity: quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
        },
      ],
    };

    try {
      await axios.post(`${API_BASE_URL}sales/`, payload, { headers: authHeaders });
      setNewSale({ customerId: "", productId: "", quantity: "", status: "pending" });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error recording sale:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server responded with:", error.response.data);
      }
    }
  };

  const handleUpdateSale = async () => {
    if (!editSale) return;

    const selectedProduct = getSelectedProduct(String(typeof editSale.items[0].product === "object" ? editSale.items[0].product.id : editSale.items[0].product));
    const quantity = editSale.items[0].quantity;
    const unitPrice = parseFloat(selectedProduct?.retail_price || selectedProduct?.price || '0') || 0;
    const lineTotal = quantity * unitPrice;

    const payload = {
      customer: typeof editSale.customer === "object" ? editSale.customer.id : editSale.customer,
      user: 1,
      sale_date: editSale.sale_date,
      total_amount: lineTotal,
      is_paid: false,
      status: editSale.status,
      items: [
        {
          product: typeof editSale.items[0].product === "object" ? editSale.items[0].product.id : editSale.items[0].product,
          quantity: quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
        },
      ],
    };

    try {
      await axios.put(`${API_BASE_URL}sales/${editSale.id}/`, payload, { headers: authHeaders });
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating sale:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server responded with:", error.response.data);
      }
    }
  };

  const handleDeleteSale = async (saleId: number) => {
    if (!window.confirm("Are you sure you want to delete this sale?")) return;
    try {
      await axios.delete(`${API_BASE_URL}sales/${saleId}/`, { headers: authHeaders });
      fetchData();
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
  };

  const getSaleIdValue = (sale: Sale) => {
    return String(sale.id);
  };

  const getCustomerName = (sale: Sale) => {
    const c = sale.customer;
    if (c && typeof c === "object") {
      return (c.shop_name || "N/A");
    }
    if (typeof c === "number") {
      const found = customers.find((cust) => cust.id === c);
      return found ? found.shop_name || found.name || `Customer #${found.id}` : `Customer #${c}`;
    }
    return "N/A";
  };

  const getProductName = (item: SaleItem) => {
    const p = item.product;
    if (p && typeof p === "object") {
      return p.name || "N/A";
    }
    if (typeof p === "number") {
      const found = products.find((prod) => prod.id === p);
      return found ? found.name || "N/A" : "N/A";
    }
    return "N/A";
  };

  const formatDateSafe = (sale: Sale, preferKeys = ["invoice_date", "sale_date", "date", "created_at"]) => {
    for (const k of preferKeys) {
      // @ts-ignore
      const v = sale[k];
      if (v) {
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d.toLocaleDateString();
        try {
          const parsed = new Date(String(v));
          if (!isNaN(parsed.getTime())) return parsed.toLocaleDateString();
        } catch (e) {}
      }
    }
    return "Invalid Date";
  };

  const handleViewSale = async (sale: Sale) => {
    const id = sale.id;
    if (!id) {
      alert("Cannot view sale: missing id");
      return;
    }

    setIsLoading(true);
    try {
      const endpointsToTry = [
        `${API_BASE_URL}/sales/${id}/`,
        `${API_BASE_URL}/invoices/${id}/`,
      ];

      let fetched = null;
      for (const url of endpointsToTry) {
        try {
          const res = await axios.get(url, { headers: authHeaders });
          fetched = res.data;
          break;
        } catch (err) {
          // ignore and try next
        }
      }

      if (!fetched) {
        setViewSale(sale);
      } else {
        setViewSale(fetched);
      }
      setIsViewDialogOpen(true);
    } catch (err) {
      console.error("View sale error:", err);
      alert("Failed to fetch sale details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSaleClick = (sale: Sale) => {
    setEditSale({
      ...sale,
      customer: typeof sale.customer === "object" ? sale.customer.id : sale.customer,
      items: sale.items.map(item => ({
        ...item,
        product: typeof item.product === "object" ? item.product.id : item.product,
      })),
    });
    setIsEditDialogOpen(true);
  };

  // Today's Sales and Average Sale Calculations
  const todaysSales = sales
    .filter((sale) => {
      const saleDate = new Date(sale.sale_date || "");
      const today = new Date();
      return (
        saleDate.getFullYear() === today.getFullYear() &&
        saleDate.getMonth() === today.getMonth() &&
        saleDate.getDate() === today.getDate()
      );
    })
    .reduce((sum, sale) => sum + parseFloat(String(sale.total_amount || '0')), 0);

  const unitsSold = sales.reduce((sum, sale) =>
    sum +
    sale.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0),
  0);

  const averageSale =
    sales.length > 0
      ? sales.reduce(
          (sum, sale) => sum + parseFloat(String(sale.total_amount || '0')),
          0
        ) / sales.length
      : 0;

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancel':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Sales Tracking
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor and record daily sales transactions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto flex items-center gap-2">
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-[90vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Record New Sale</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Add a new sale transaction to track inventory and revenue.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                <Label htmlFor="customer" className="text-sm sm:text-base">Customer</Label>
                <Select
                  value={newSale.customerId}
                  onValueChange={(value) =>
                    setNewSale((prev) => ({ ...prev, customerId: value }))
                  }
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem
                        key={customer.id}
                        value={customer.id.toString()}
                      >
                        {customer.shop_name || customer.name || `Customer #${customer.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm sm:text-base">Product</Label>
                <Select
                  value={newSale.productId}
                  onValueChange={(value) =>
                    setNewSale((prev) => ({ ...prev, productId: value }))
                  }
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem
                        key={product.id}
                        value={product.id.toString()}
                      >
                        {product.name} - ৳{product.retail_price || product.price} (Stock: {product.stock_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm sm:text-base">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={newSale.quantity}
                  onChange={(e) =>
                    setNewSale((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Price</Label>
                <Input
                  value={(parseFloat(getSelectedProduct(newSale.productId)?.retail_price || getSelectedProduct(newSale.productId)?.price || '0') || 0).toFixed(2)}
                  readOnly
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm sm:text-base">Status</Label>
                <Select
                  value={newSale.status}
                  onValueChange={(value) =>
                    setNewSale((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancel">Cancel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end items-center gap-2 pt-4 border-t">
                <span className="text-sm sm:text-base font-semibold">Total:</span>
                <span className="text-lg sm:text-xl font-bold">৳{calculateTotal(newSale.quantity, newSale.productId).toFixed(2)}</span>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" onClick={handleAddSale} className="w-full sm:w-auto">Record Sale</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sales Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">৳{todaysSales.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{unitsSold}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              ৳{averageSale.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Sales</CardTitle>
          <CardDescription className="text-sm sm:text-base">All sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Sale ID</TableHead>
                  <TableHead className="text-xs sm:text-sm">Date</TableHead>
                  <TableHead className="text-xs sm:text-sm">Customer</TableHead>
                  <TableHead className="text-xs sm:text-sm">Product</TableHead>
                  <TableHead className="text-xs sm:text-sm">Quantity</TableHead>
                  <TableHead className="text-xs sm:text-sm">Price</TableHead>
                  <TableHead className="text-xs sm:text-sm">Total</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-xs sm:text-sm">
                      Loading sales...
                    </TableCell>
                  </TableRow>
                ) : sales.length > 0 ? (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        S{String(sale.id).padStart(3, "0")}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{formatDateSafe(sale)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{getCustomerName(sale)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{sale.items[0] ? getProductName(sale.items[0]) : "N/A"}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{sale.items[0]?.quantity || "N/A"}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        ৳{parseFloat(sale.items[0]?.unit_price || "0").toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        ৳{parseFloat(String(sale.total_amount)).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant={getStatusVariant(sale.status)}>
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleViewSale(sale)}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleEditSaleClick(sale)}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDeleteSale(sale.id)}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-xs sm:text-sm">
                      No sales recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View sale dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Sale Details</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">Details from server (if available)</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewSale ? (
              <div className="space-y-2 text-sm sm:text-base">
                <div><strong>ID:</strong> {getSaleIdValue(viewSale)}</div>
                <div><strong>Customer:</strong> {getCustomerName(viewSale)}</div>
                <div><strong>Date:</strong> {formatDateSafe(viewSale)}</div>
                <div><strong>Due Date:</strong> {formatDateSafe(viewSale, ["due_date"])}</div>
                <div><strong>Amount:</strong> ৳{parseFloat(String(viewSale.total_amount || '0')).toLocaleString()}</div>
                <div><strong>Status:</strong> {viewSale.status || "N/A"}</div>
                <pre className="bg-muted p-2 rounded text-xs sm:text-sm overflow-auto">{JSON.stringify(viewSale, null, 2)}</pre>
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

      {/* Edit sale dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Sale</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Update the sale transaction.
            </DialogDescription>
          </DialogHeader>
          {editSale && (
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                <Label htmlFor="customer" className="text-sm sm:text-base">Customer</Label>
                <Select
                  value={String(editSale.customer)}
                  onValueChange={(value) => setEditSale({ ...editSale, customer: parseInt(value) })}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.shop_name || customer.name || `Customer #${customer.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm sm:text-base">Product</Label>
                <Select
                  value={String(editSale.items[0].product)}
                  onValueChange={(value) => setEditSale({ ...editSale, items: [{ ...editSale.items[0], product: parseInt(value) }] })}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - ৳{product.retail_price || product.price} (Stock: {product.stock_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm sm:text-base">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={editSale.items[0].quantity}
                  onChange={(e) => setEditSale({ ...editSale, items: [{ ...editSale.items[0], quantity: parseInt(e.target.value) || 0 }] })}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Price</Label>
                <Input
                  value={(parseFloat(getSelectedProduct(String(editSale.items[0].product))?.retail_price || getSelectedProduct(String(editSale.items[0].product))?.price || '0') || 0).toFixed(2)}
                  readOnly
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm sm:text-base">Status</Label>
                <Select
                  value={editSale.status}
                  onValueChange={(value) => setEditSale({ ...editSale, status: value })}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancel">Cancel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end items-center gap-2 pt-4 border-t">
                <span className="text-sm sm:text-base font-semibold">Total:</span>
                <span className="text-lg sm:text-xl font-bold">৳{calculateTotal(String(editSale.items[0].quantity), String(editSale.items[0].product)).toFixed(2)}</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" onClick={handleUpdateSale} className="w-full sm:w-auto">Update Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesTracker;