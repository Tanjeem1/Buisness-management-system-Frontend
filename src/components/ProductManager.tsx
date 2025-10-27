

import { useState, useEffect, useCallback } from "react";
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
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// Define interfaces based on your API
export interface Vendor {
  id: number;
  name: string;
}

export interface WholesalePurchase {
  id: number;
  product: number;
  purchase_date: string;
}

export interface SaleItem {
  product: number;
  quantity: number;
}

export interface Sale {
  id: number;
  items: SaleItem[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  retail_price: string;
  wholesale_cost: string;
  stock_quantity: number;
  min_stock: number;
  max_stock: number;
  last_purchase_date: string;
  last_purchase_time: string;
  vendor: number | { id: number; name: string } | null;
}

const API_BASE_URL = "https://pabnabazar.live/api/";
const AUTH_TOKEN = "Token 2418fedd927fddbd0a1de8c5f2b106a7b0315a2d";
const authHeaders = {
  headers: {
    Authorization: AUTH_TOKEN,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// Custom hook to fetch all product-related data
export const useProductData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<WholesalePurchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
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
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch product data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized function for calculating sold quantity
  const getSoldQuantity = useCallback((productId: number) => {
    let totalSold = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.product === productId) {
          totalSold += item.quantity;
        }
      });
    });
    return totalSold;
  }, [sales]);

  // Memoized function for getting vendor name
  const getVendorName = useCallback((product: Product) => {
    const v = product.vendor;
    if (v && typeof v === "object") {
      return v.name || "N/A";
    }
    if (typeof v === "number") {
      const found = vendors.find((ven) => ven.id === v);
      return found ? found.name || "N/A" : "N/A";
    }
    return "N/A";
  }, [vendors]);

  // Memoized function for getting last purchase date
  const getLastPurchaseDate = useCallback((productId: number) => {
    const productPurchases = purchases.filter(p => p.product === productId);
    if (productPurchases.length === 0) return "N/A";
    const latest = productPurchases.reduce((latest, current) => {
      return new Date(current.purchase_date) > new Date(latest.purchase_date) ? current : latest;
    });
    return new Date(latest.purchase_date).toLocaleDateString();
  }, [purchases]);


  return { products, vendors, purchases, sales, isLoading, error, fetchData, getSoldQuantity, getVendorName, getLastPurchaseDate };
};

// Custom hook specifically for low stock products (reusing useProductData)
export const useLowStockProducts = () => {
  const { products, sales, isLoading, error, getSoldQuantity, fetchData } = useProductData();
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!isLoading && products.length > 0) {
      const filtered = products.filter(p => {
        const sold = getSoldQuantity(p.id);
        const effectiveStock = p.stock_quantity - sold;
        return effectiveStock <= 20; // Assuming 20 is the low stock threshold
      });
      setLowStockProducts(filtered);
    }
  }, [products, sales, isLoading, getSoldQuantity]);

  return { lowStockProducts, isLoading, error, refetchData: fetchData, getSoldQuantity };
}


const ProductManager = () => {
  const { products, vendors, isLoading, fetchData, getSoldQuantity, getVendorName, getLastPurchaseDate } = useProductData();
  const { lowStockProducts } = useLowStockProducts(); // Use the new hook here

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
      fetchData(); // Refetch data after adding
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
      fetchData(); // Refetch data after updating
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
      fetchData(); // Refetch data after deleting
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleViewProduct = (product: Product) => {
    setViewProduct(product);
    setIsViewDialogOpen(true);
  };

  // Stats
  const totalProducts = products.length;

  const lowStockCount = lowStockProducts.length;

  const averageRetailPrice = products.length > 0
    ? products.reduce((sum, p) => sum + parseFloat(p.retail_price || '0'), 0) / products.length
    : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Product Management
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and record products</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto flex items-center gap-2">
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Create Product
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-[90vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Create New Product</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">Add a new product to the system.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">Name</Label>
                <Input id="name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
                <Input id="description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retail_price" className="text-sm sm:text-base">Retail Price</Label>
                <Input id="retail_price" type="number" step="0.01" value={newProduct.retail_price} onChange={(e) => setNewProduct({ ...newProduct, retail_price: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wholesale_cost" className="text-sm sm:text-base">Wholesale Cost</Label>
                <Input id="wholesale_cost" type="number" step="0.01" value={newProduct.wholesale_cost} onChange={(e) => setNewProduct({ ...newProduct, wholesale_cost: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_quantity" className="text-sm sm:text-base">Initial Stock Quantity</Label>
                <Input id="stock_quantity" type="number" value={newProduct.stock_quantity} onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock" className="text-sm sm:text-base">Min Stock</Label>
                <Input id="min_stock" type="number" value={newProduct.min_stock} onChange={(e) => setNewProduct({ ...newProduct, min_stock: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_stock" className="text-sm sm:text-base">Max Stock</Label>
                <Input id="max_stock" type="number" value={newProduct.max_stock} onChange={(e) => setNewProduct({ ...newProduct, max_stock: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_purchase_date" className="text-sm sm:text-base">Last Purchase Date</Label>
                <Input id="last_purchase_date" type="date" value={newProduct.last_purchase_date} onChange={(e) => setNewProduct({ ...newProduct, last_purchase_date: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_purchase_time" className="text-sm sm:text-base">Last Purchase Time</Label>
                <Input id="last_purchase_time" type="time" value={newProduct.last_purchase_time} onChange={(e) => setNewProduct({ ...newProduct, last_purchase_time: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor" className="text-sm sm:text-base">Vendor</Label>
                <Select value={newProduct.vendor} onValueChange={(value) => setNewProduct({ ...newProduct, vendor: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" onClick={handleAddProduct} className="w-full sm:w-auto">Create Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{lowStockCount}</div>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Retail Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">৳{averageRetailPrice.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Product List</CardTitle>
          <CardDescription className="text-sm sm:text-base">Manage all products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">ID</TableHead>
                  <TableHead className="text-xs sm:text-sm">Name</TableHead>
                  <TableHead className="text-xs sm:text-sm">Retail Price</TableHead>
                  <TableHead className="text-xs sm:text-sm">Wholesale Cost</TableHead>
                  <TableHead className="text-xs sm:text-sm">Current Stock</TableHead>
                  <TableHead className="text-xs sm:text-sm">Sold</TableHead>
                  <TableHead className="text-xs sm:text-sm">Vendor</TableHead>
                  <TableHead className="text-xs sm:text-sm">Last Purchase</TableHead>
                  <TableHead className="text-xs sm:text-sm text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-xs sm:text-sm">Loading products...</TableCell>
                  </TableRow>
                ) : products.length > 0 ? (
                  products.map((product) => {
                    const sold = getSoldQuantity(product.id);
                    const effectiveStock = product.stock_quantity - sold;
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">{product.id}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{product.name}</TableCell>
                        <TableCell className="text-xs sm:text-sm">৳{parseFloat(product.retail_price).toFixed(2)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">৳{parseFloat(product.wholesale_cost).toFixed(2)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{effectiveStock}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{sold}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{getVendorName(product)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{getLastPurchaseDate(product.id)}</TableCell>
                        <TableCell className="flex gap-1 justify-end">
                          <Button size="icon" variant="outline" onClick={() => handleViewProduct(product)}>
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => { setEditProduct(product); setIsEditDialogOpen(true); }}>
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button size="icon" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-xs sm:text-sm">No products found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Product</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">Update the product details.</DialogDescription>
          </DialogHeader>
          {editProduct && (
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">Name</Label>
                <Input id="name" value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
                <Input id="description" value={editProduct.description} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retail_price" className="text-sm sm:text-base">Retail Price</Label>
                <Input id="retail_price" type="number" step="0.01" value={editProduct.retail_price} onChange={(e) => setEditProduct({ ...editProduct, retail_price: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wholesale_cost" className="text-sm sm:text-base">Wholesale Cost</Label>
                <Input id="wholesale_cost" type="number" step="0.01" value={editProduct.wholesale_cost} onChange={(e) => setEditProduct({ ...editProduct, wholesale_cost: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_quantity" className="text-sm sm:text-base">Initial Stock Quantity</Label>
                <Input id="stock_quantity" type="number" value={editProduct.stock_quantity} onChange={(e) => setEditProduct({ ...editProduct, stock_quantity: parseInt(e.target.value) || 0 })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock" className="text-sm sm:text-base">Min Stock</Label>
                <Input id="min_stock" type="number" value={editProduct.min_stock} onChange={(e) => setEditProduct({ ...editProduct, min_stock: parseInt(e.target.value) || 0 })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_stock" className="text-sm sm:text-base">Max Stock</Label>
                <Input id="max_stock" type="number" value={editProduct.max_stock} onChange={(e) => setEditProduct({ ...editProduct, max_stock: parseInt(e.target.value) || 0 })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_purchase_date" className="text-sm sm:text-base">Last Purchase Date</Label>
                <Input id="last_purchase_date" type="date" value={editProduct.last_purchase_date} onChange={(e) => setEditProduct({ ...editProduct, last_purchase_date: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_purchase_time" className="text-sm sm:text-base">Last Purchase Time</Label>
                <Input id="last_purchase_time" type="time" value={editProduct.last_purchase_time} onChange={(e) => setEditProduct({ ...editProduct, last_purchase_time: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor" className="text-sm sm:text-base">Vendor</Label>
                <Select value={String(typeof editProduct.vendor === "object" && editProduct.vendor ? editProduct.vendor.id : editProduct.vendor || "")} onValueChange={(value) => setEditProduct({ ...editProduct, vendor: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" onClick={handleUpdateProduct} className="w-full sm:w-auto">Update Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManager;