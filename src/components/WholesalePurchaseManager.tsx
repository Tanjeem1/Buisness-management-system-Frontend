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

// Define interfaces based on your API
interface Vendor {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  retail_price: string;
  wholesale_cost: string;
  stock_quantity: number;
}

interface WholesalePurchase {
  id: number;
  product: number | { id: number; name: string }; // Can be ID or nested object
  vendor: number | { id: number; name: string };   // Can be ID or nested object
  quantity: number;
  cost_per_unit: string;
  purchase_date: string;
}

const WholesalePurchaseManager = () => {
  const [purchases, setPurchases] = useState<WholesalePurchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for Create Purchase Dialog
  const [newPurchase, setNewPurchase] = useState({
    product: "",
    vendor: "",
    quantity: "",
    cost_per_unit: "",
    purchase_date: "",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // State for Edit Purchase Dialog
  const [editPurchase, setEditPurchase] = useState<WholesalePurchase | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // State for View Purchase Dialog
  const [viewPurchase, setViewPurchase] = useState<WholesalePurchase | null>(null);
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

  // Helper for FormData requests (required by your API examples for POST/PUT)
  const authHeadersFormData = {
    headers: {
      Authorization: AUTH_TOKEN,
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [purchasesRes, productsRes, vendorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}wholesalepurchases/`, authHeaders),
        axios.get(`${API_BASE_URL}products/`, authHeaders),
        axios.get(`${API_BASE_URL}vendors/`, authHeaders),
      ]);
      setPurchases(purchasesRes.data || []);
      setProducts(productsRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getProductName = (productId: number | { id: number; name: string }) => {
    const id = typeof productId === "object" ? productId.id : productId;
    const found = products.find((prod) => prod.id === id);
    return found ? found.name : "N/A";
  };

  const getVendorName = (vendorId: number | { id: number; name: string }) => {
    const id = typeof vendorId === "object" ? vendorId.id : vendorId;
    const found = vendors.find((ven) => ven.id === id);
    return found ? found.name : "N/A";
  };

  const handleAddPurchase = async () => {
    if (!newPurchase.product || !newPurchase.vendor || !newPurchase.quantity || !newPurchase.cost_per_unit || !newPurchase.purchase_date) {
      alert("Please fill out all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("product", newPurchase.product);
    formData.append("vendor", newPurchase.vendor);
    formData.append("quantity", newPurchase.quantity);
    formData.append("cost_per_unit", newPurchase.cost_per_unit);
    formData.append("purchase_date", newPurchase.purchase_date);

    try {
      await axios.post(`${API_BASE_URL}wholesalepurchases/`, formData, authHeadersFormData);
      setNewPurchase({
        product: "",
        vendor: "",
        quantity: "",
        cost_per_unit: "",
        purchase_date: "",
      });
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating wholesale purchase:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server responded with:", error.response.data);
      }
    }
  };

  const handleUpdatePurchase = async () => {
    if (!editPurchase) return;

    const formData = new FormData();
    formData.append("product", String(typeof editPurchase.product === "object" ? editPurchase.product.id : editPurchase.product));
    formData.append("vendor", String(typeof editPurchase.vendor === "object" ? editPurchase.vendor.id : editPurchase.vendor));
    formData.append("quantity", String(editPurchase.quantity));
    formData.append("cost_per_unit", editPurchase.cost_per_unit);
    formData.append("purchase_date", editPurchase.purchase_date);

    try {
      await axios.put(`${API_BASE_URL}wholesalepurchases/${editPurchase.id}/`, formData, authHeadersFormData);
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating wholesale purchase:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server responded with:", error.response.data);
      }
    }
  };

  const handleDeletePurchase = async (purchaseId: number) => {
    if (!window.confirm("Are you sure you want to delete this wholesale purchase?")) return;
    try {
      await axios.delete(`${API_BASE_URL}wholesalepurchases/${purchaseId}/`, authHeaders);
      fetchData();
    } catch (error) {
      console.error("Error deleting wholesale purchase:", error);
    }
  };

  const handleViewPurchase = (purchase: WholesalePurchase) => {
    setViewPurchase(purchase);
    setIsViewDialogOpen(true);
  };

  const setPurchaseDateToToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setNewPurchase({ ...newPurchase, purchase_date: `${year}-${month}-${day}` });
  };

  const setEditPurchaseDateToToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    if (editPurchase) {
      setEditPurchase({ ...editPurchase, purchase_date: `${year}-${month}-${day}` });
    }
  };

  // Stats
  const totalPurchases = purchases.length;
  const averagePurchaseCost = purchases.length > 0
    ? purchases.reduce((sum, p) => sum + parseFloat(p.cost_per_unit || '0') * p.quantity, 0) / purchases.length
    : 0;

  // Find most purchased item
  const purchasedItemCounts = new Map<number, number>();
  purchases.forEach(p => {
    const productId = typeof p.product === 'object' ? p.product.id : p.product;
    const currentQuantity = purchasedItemCounts.get(productId) || 0;
    purchasedItemCounts.set(productId, currentQuantity + p.quantity);
  });

  let mostPurchasedItem = "N/A";
  let maxQuantity = 0;
  if (purchasedItemCounts.size > 0) {
    let mostPurchasedProductId: number | null = null;
    purchasedItemCounts.forEach((quantity, productId) => {
      if (quantity > maxQuantity) {
        maxQuantity = quantity;
        mostPurchasedProductId = productId;
      }
    });
    if (mostPurchasedProductId !== null) {
      mostPurchasedItem = `${getProductName(mostPurchasedProductId)} - ${maxQuantity} units`;
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Wholesale Purchase Management
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and record wholesale purchases</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto flex items-center gap-2">
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Create Wholesale Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-[90vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Create New Wholesale Purchase</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">Add a new wholesale purchase record.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm sm:text-base">Product</Label>
                <Select value={newPurchase.product} onValueChange={(value) => setNewPurchase({ ...newPurchase, product: value })}>
                  <SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map((product) => (<SelectItem key={product.id} value={product.id.toString()}>{product.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor" className="text-sm sm:text-base">Vendor</Label>
                <Select value={newPurchase.vendor} onValueChange={(value) => setNewPurchase({ ...newPurchase, vendor: value })}>
                  <SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>{vendors.map((vendor) => (<SelectItem key={vendor.id} value={vendor.id.toString()}>{vendor.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm sm:text-base">Quantity</Label>
                <Input id="quantity" type="number" value={newPurchase.quantity} onChange={(e) => setNewPurchase({ ...newPurchase, quantity: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_per_unit" className="text-sm sm:text-base">Cost per unit</Label>
                <Input id="cost_per_unit" type="number" step="0.01" value={newPurchase.cost_per_unit} onChange={(e) => setNewPurchase({ ...newPurchase, cost_per_unit: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_date" className="text-sm sm:text-base">Purchase date</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input id="purchase_date" type="date" value={newPurchase.purchase_date} onChange={(e) => setNewPurchase({ ...newPurchase, purchase_date: e.target.value })} className="text-sm sm:text-base" />
                  <Button variant="outline" onClick={setPurchaseDateToToday} className="w-full sm:w-auto">Today</Button>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" onClick={handleAddPurchase} className="w-full sm:w-auto">Create Purchase</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalPurchases}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Purchase Cost (per purchase)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">৳{averagePurchaseCost.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Purchased Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-lg font-bold">{mostPurchasedItem}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Wholesale Purchase List</CardTitle>
          <CardDescription className="text-sm sm:text-base">Manage all wholesale purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">ID</TableHead>
                  <TableHead className="text-xs sm:text-sm">Product</TableHead>
                  <TableHead className="text-xs sm:text-sm">Vendor</TableHead>
                  <TableHead className="text-xs sm:text-sm">Quantity</TableHead>
                  <TableHead className="text-xs sm:text-sm">Cost/Unit</TableHead>
                  <TableHead className="text-xs sm:text-sm">Total Cost</TableHead>
                  <TableHead className="text-xs sm:text-sm">Purchase Date</TableHead>
                  <TableHead className="text-xs sm:text-sm text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs sm:text-sm">
                      Loading purchases...
                    </TableCell>
                  </TableRow>
                ) : purchases.length > 0 ? (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium text-xs sm:text-sm">{purchase.id}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{getProductName(purchase.product)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{getVendorName(purchase.vendor)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{purchase.quantity}</TableCell>
                      <TableCell className="text-xs sm:text-sm">৳{parseFloat(purchase.cost_per_unit).toFixed(2)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">৳{(parseFloat(purchase.cost_per_unit) * purchase.quantity).toFixed(2)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                      <TableCell className="flex gap-1 justify-end">
                        <Button size="icon" variant="outline" onClick={() => handleViewPurchase(purchase)}>
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => { setEditPurchase(purchase); setIsEditDialogOpen(true); }}>
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDeletePurchase(purchase.id)}>
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs sm:text-sm">
                      No wholesale purchases found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Purchase Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Wholesale Purchase Details</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">Details of the wholesale purchase</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewPurchase ? (
              <div className="space-y-2 text-sm sm:text-base">
                <div><strong>ID:</strong> {viewPurchase.id}</div>
                <div><strong>Product:</strong> {getProductName(viewPurchase.product)}</div>
                <div><strong>Vendor:</strong> {getVendorName(viewPurchase.vendor)}</div>
                <div><strong>Quantity:</strong> {viewPurchase.quantity}</div>
                <div><strong>Cost per unit:</strong> ৳{parseFloat(viewPurchase.cost_per_unit).toFixed(2)}</div>
                <div><strong>Total Cost:</strong> ৳{(parseFloat(viewPurchase.cost_per_unit) * viewPurchase.quantity).toFixed(2)}</div>
                <div><strong>Purchase Date:</strong> {new Date(viewPurchase.purchase_date).toLocaleDateString()}</div>
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

      {/* Edit Purchase Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Wholesale Purchase</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">Update the wholesale purchase details.</DialogDescription>
          </DialogHeader>
          {editPurchase && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-product" className="text-sm sm:text-base">Product</Label>
                <Select
                  value={String(typeof editPurchase.product === "object" ? editPurchase.product.id : editPurchase.product)}
                  onValueChange={(value) => setEditPurchase({ ...editPurchase, product: parseInt(value) })}
                >
                  <SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map((product) => (<SelectItem key={product.id} value={product.id.toString()}>{product.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vendor" className="text-sm sm:text-base">Vendor</Label>
                <Select
                  value={String(typeof editPurchase.vendor === "object" ? editPurchase.vendor.id : editPurchase.vendor)}
                  onValueChange={(value) => setEditPurchase({ ...editPurchase, vendor: parseInt(value) })}
                >
                  <SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>{vendors.map((vendor) => (<SelectItem key={vendor.id} value={vendor.id.toString()}>{vendor.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quantity" className="text-sm sm:text-base">Quantity</Label>
                <Input id="edit-quantity" type="number" value={editPurchase.quantity} onChange={(e) => setEditPurchase({ ...editPurchase, quantity: parseInt(e.target.value) || 0 })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cost_per_unit" className="text-sm sm:text-base">Cost per unit</Label>
                <Input id="edit-cost_per_unit" type="number" step="0.01" value={editPurchase.cost_per_unit} onChange={(e) => setEditPurchase({ ...editPurchase, cost_per_unit: e.target.value })} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-purchase_date" className="text-sm sm:text-base">Purchase date</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input id="edit-purchase_date" type="date" value={editPurchase.purchase_date} onChange={(e) => setEditPurchase({ ...editPurchase, purchase_date: e.target.value })} className="text-sm sm:text-base" />
                  <Button variant="outline" onClick={setEditPurchaseDateToToday} className="w-full sm:w-auto">Today</Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" onClick={handleUpdatePurchase} className="w-full sm:w-auto">Update Purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WholesalePurchaseManager;