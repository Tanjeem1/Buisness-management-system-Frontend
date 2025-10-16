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
import { PlusCircle, Eye, Edit, Trash2 } from "lucide-react";
import axios from "axios";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define interfaces based on your API
interface Vendor {
  id: number;
  name: string;
}

interface WholesalePurchase {
  id: number;
  product: number;
  purchase_date: string;
}

interface SaleItem {
  product: number;
  quantity: number;
}

interface Sale {
  id: number;
  items: SaleItem[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  retail_price: string;
  wholesale_cost: string;
  stock_quantity: number; // This is treated as the INITIAL stock from the API
  min_stock: number;
  max_stock: number;
  last_purchase_date: string;
  last_purchase_time: string;
  vendor: number | { id: number; name: string } | null;
}

const ProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<WholesalePurchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    retail_price: "",
    wholesale_cost: "",
    stock_quantity: "",
    min_stock: "",
    max_stock: "",
    last_purchase_date: "",
    last_purchase_time: "",
    vendor: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Edit modal
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // View modal
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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, vendorsRes, purchasesRes, salesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}products/`, authHeaders),
        axios.get(`${API_BASE_URL}vendors/`, authHeaders),
        axios.get(`${API_BASE_URL}wholesalepurchases/`, authHeaders),
        axios.get(`${API_BASE_URL}sales/`, authHeaders),
      ]);
      setProducts(productsRes.data || []);
      setVendors(vendorsRes.data || []);
      setPurchases(purchasesRes.data || []);
      setSales(salesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.retail_price || !newProduct.wholesale_cost || !newProduct.stock_quantity || !newProduct.vendor) {
      alert("Please fill out required fields.");
      return;
    }

    const payload = {
      name: newProduct.name,
      description: newProduct.description,
      retail_price: parseFloat(newProduct.retail_price),
      wholesale_cost: parseFloat(newProduct.wholesale_cost),
      stock_quantity: parseInt(newProduct.stock_quantity),
      min_stock: parseInt(newProduct.min_stock) || 0,
      max_stock: parseInt(newProduct.max_stock) || 0,
      last_purchase_date: newProduct.last_purchase_date || null,
      last_purchase_time: newProduct.last_purchase_time || null,
      vendor: parseInt(newProduct.vendor),
    };

    try {
      await axios.post(`${API_BASE_URL}products/`, payload, authHeaders);
      setNewProduct({
        name: "",
        description: "",
        retail_price: "",
        wholesale_cost: "",
        stock_quantity: "",
        min_stock: "",
        max_stock: "",
        last_purchase_date: "",
        last_purchase_time: "",
        vendor: "",
      });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating product:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server responded with:", error.response.data);
      }
    }
  };

  const handleUpdateProduct = async () => {
    if (!editProduct) return;

    const payload = {
      name: editProduct.name,
      description: editProduct.description,
      retail_price: parseFloat(editProduct.retail_price),
      wholesale_cost: parseFloat(editProduct.wholesale_cost),
      stock_quantity: editProduct.stock_quantity,
      min_stock: editProduct.min_stock,
      max_stock: editProduct.max_stock,
      last_purchase_date: editProduct.last_purchase_date,
      last_purchase_time: editProduct.last_purchase_time,
      vendor: typeof editProduct.vendor === "object" && editProduct.vendor ? editProduct.vendor.id : editProduct.vendor,
    };

    try {
      await axios.put(`${API_BASE_URL}products/${editProduct.id}/`, payload, authHeaders);
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating product:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server responded with:", error.response.data);
      }
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_BASE_URL}products/${productId}/`, authHeaders);
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const getVendorName = (product: Product) => {
    const v = product.vendor;
    if (v && typeof v === "object") {
      return v.name || "N/A";
    }
    if (typeof v === "number") {
      const found = vendors.find((ven) => ven.id === v);
      return found ? found.name || "N/A" : "N/A";
    }
    return "N/A";
  };

  const getLastPurchaseDate = (productId: number) => {
    const productPurchases = purchases.filter(p => p.product === productId);
    if (productPurchases.length === 0) return "N/A";
    const latest = productPurchases.reduce((latest, current) => {
      return new Date(current.purchase_date) > new Date(latest.purchase_date) ? current : latest;
    });
    return new Date(latest.purchase_date).toLocaleDateString();
  };

  const getSoldQuantity = (productId: number) => {
    let totalSold = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.product === productId) {
          totalSold += item.quantity;
        }
      });
    });
    return totalSold;
  };

  const handleViewProduct = (product: Product) => {
    setViewProduct(product);
    setIsViewDialogOpen(true);
  };

  // Stats
  const totalProducts = products.length;

  // ✅ FIX: Corrected Low Stock Logic.
  // A product is "low stock" if its calculated current stock is 20 or less.
  const lowStockProducts = products.filter(p => {
    const sold = getSoldQuantity(p.id);
    const effectiveStock = p.stock_quantity - sold;
    return effectiveStock <= 20;
  });

  const lowStockCount = lowStockProducts.length;

  const averageRetailPrice = products.length > 0
    ? products.reduce((sum, p) => sum + parseFloat(p.retail_price || '0'), 0) / products.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Management</h2>
          <p className="text-muted-foreground">Manage and record products</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button><PlusCircle className="w-4 h-4 mr-2" />Create Product</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Create New Product</DialogTitle><DialogDescription>Add a new product to the system.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="retail_price">Retail Price</Label><Input id="retail_price" type="number" step="0.01" value={newProduct.retail_price} onChange={(e) => setNewProduct({ ...newProduct, retail_price: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="wholesale_cost">Wholesale Cost</Label><Input id="wholesale_cost" type="number" step="0.01" value={newProduct.wholesale_cost} onChange={(e) => setNewProduct({ ...newProduct, wholesale_cost: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="stock_quantity">Initial Stock Quantity</Label><Input id="stock_quantity" type="number" value={newProduct.stock_quantity} onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="min_stock">Min Stock</Label><Input id="min_stock" type="number" value={newProduct.min_stock} onChange={(e) => setNewProduct({ ...newProduct, min_stock: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="max_stock">Max Stock</Label><Input id="max_stock" type="number" value={newProduct.max_stock} onChange={(e) => setNewProduct({ ...newProduct, max_stock: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="last_purchase_date">Last Purchase Date</Label><Input id="last_purchase_date" type="date" value={newProduct.last_purchase_date} onChange={(e) => setNewProduct({ ...newProduct, last_purchase_date: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="last_purchase_time">Last Purchase Time</Label><Input id="last_purchase_time" type="time" value={newProduct.last_purchase_time} onChange={(e) => setNewProduct({ ...newProduct, last_purchase_time: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="vendor">Vendor</Label>
                <Select value={newProduct.vendor} onValueChange={(value) => setNewProduct({ ...newProduct, vendor: value })}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>{vendors.map((vendor) => (<SelectItem key={vendor.id} value={vendor.id.toString()}>{vendor.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="submit" onClick={handleAddProduct}>Create Product</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Products</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalProducts}</div></CardContent></Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Low Stock Products</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <TooltipProvider>
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((prod) => {
                    const sold = getSoldQuantity(prod.id);
                    const effectiveStock = prod.stock_quantity - sold;
                    return (
                      <Tooltip key={prod.id}>
                        <TooltipTrigger asChild><Button size="sm" variant="outline" onClick={() => handleViewProduct(prod)}>{prod.name}</Button></TooltipTrigger>
                        <TooltipContent><p>Current Stock: {effectiveStock}</p><p>Units Sold: {sold}</p></TooltipContent>
                      </Tooltip>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">No low stock products</div>
                )}
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Average Retail Price</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">৳{averageRetailPrice.toFixed(2)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Product List</CardTitle><CardDescription>Manage all products</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Retail Price</TableHead><TableHead>Wholesale Cost</TableHead><TableHead>Current Stock</TableHead><TableHead>Sold</TableHead><TableHead>Vendor</TableHead><TableHead>Last Purchase</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center">Loading products...</TableCell></TableRow>
              ) : products.length > 0 ? (
                products.map((product) => {
                  const sold = getSoldQuantity(product.id);
                  // ✅ FIX: The core logic correction is here.
                  // Current Stock = Initial Stock from API - Units Sold
                  const effectiveStock = product.stock_quantity - sold;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.id}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>৳{parseFloat(product.retail_price).toFixed(2)}</TableCell>
                      <TableCell>৳{parseFloat(product.wholesale_cost).toFixed(2)}</TableCell>
                      <TableCell>{effectiveStock}</TableCell>
                      <TableCell>{sold}</TableCell>
                      <TableCell>{getVendorName(product)}</TableCell>
                      <TableCell>{getLastPurchaseDate(product.id)}</TableCell>
                      <TableCell className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleViewProduct(product)}><Eye className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditProduct(product); setIsEditDialogOpen(true); }}><Edit className="w-3 h-3" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="w-3 h-3" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={9} className="text-center">No products found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Product Details</DialogTitle><DialogDescription>Details of the product</DialogDescription></DialogHeader>
          <div className="py-4">
            {viewProduct ? (
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {viewProduct.id}</div>
                <div><strong>Name:</strong> {viewProduct.name}</div>
                {/* ✅ FIX: Show the calculated current stock in the view dialog */}
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
              <div>No details available</div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle><DialogDescription>Update the product details.</DialogDescription></DialogHeader>
          {editProduct && (
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" value={editProduct.description} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="retail_price">Retail Price</Label><Input id="retail_price" type="number" step="0.01" value={editProduct.retail_price} onChange={(e) => setEditProduct({ ...editProduct, retail_price: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="wholesale_cost">Wholesale Cost</Label><Input id="wholesale_cost" type="number" step="0.01" value={editProduct.wholesale_cost} onChange={(e) => setEditProduct({ ...editProduct, wholesale_cost: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="stock_quantity">Initial Stock Quantity</Label><Input id="stock_quantity" type="number" value={editProduct.stock_quantity} onChange={(e) => setEditProduct({ ...editProduct, stock_quantity: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label htmlFor="min_stock">Min Stock</Label><Input id="min_stock" type="number" value={editProduct.min_stock} onChange={(e) => setEditProduct({ ...editProduct, min_stock: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label htmlFor="max_stock">Max Stock</Label><Input id="max_stock" type="number" value={editProduct.max_stock} onChange={(e) => setEditProduct({ ...editProduct, max_stock: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label htmlFor="last_purchase_date">Last Purchase Date</Label><Input id="last_purchase_date" type="date" value={editProduct.last_purchase_date} onChange={(e) => setEditProduct({ ...editProduct, last_purchase_date: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="last_purchase_time">Last Purchase Time</Label><Input id="last_purchase_time" type="time" value={editProduct.last_purchase_time} onChange={(e) => setEditProduct({ ...editProduct, last_purchase_time: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="vendor">Vendor</Label>
                <Select value={String(typeof editProduct.vendor === "object" && editProduct.vendor ? editProduct.vendor.id : editProduct.vendor || "")} onValueChange={(value) => setEditProduct({ ...editProduct, vendor: parseInt(value) })}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>{vendors.map((vendor) => (<SelectItem key={vendor.id} value={vendor.id.toString()}>{vendor.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter><Button type="submit" onClick={handleUpdateProduct}>Update Product</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManager;