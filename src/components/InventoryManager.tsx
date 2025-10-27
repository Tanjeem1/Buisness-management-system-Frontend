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
} from "@/components/ui/dialog";
import {
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Wallet,
} from "lucide-react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

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
  min_stock?: number;
  max_stock?: number;
  last_purchase?: string;
  vendor?: number;
}

interface WholesalePurchase {
  id: number;
  product: number | { id: number; name: string };
  vendor: number | { id: number; name: string };
  quantity: number;
  cost_per_unit: string;
  purchase_date: string;
}

const InventoryManager = () => {
  const [purchases, setPurchases] = useState<WholesalePurchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [viewPurchase, setViewPurchase] = useState<WholesalePurchase | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [newPurchaseFormData, setNewPurchaseFormData] = useState<Partial<WholesalePurchase>>({
    product: "",
    vendor: "",
    quantity: 0,
    cost_per_unit: "",
    purchase_date: "",
  });

  const API_BASE_URL = "https://pabnabazar.live/api/";
  const AUTH_TOKEN = "Token 2418fedd927fddbd0a1de8c5f2b106a7b0315a2d";

  const authHeaders = {
    headers: {
      Authorization: AUTH_TOKEN,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

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
      toast.error("Failed to fetch data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getProductName = (productId: number | { id: number; name: string }) => {
    const id = typeof productId === "object" ? productId.id : productId;
    return products.find((p) => p.id === id)?.name || "N/A";
  };

  const getVendorName = (vendorId: number | { id: number; name: string }) => {
    const id = typeof vendorId === "object" ? vendorId.id : vendorId;
    return vendors.find((v) => v.id === id)?.name || "N/A";
  };

  const handleSavePurchase = async () => {
    if (
      !newPurchaseFormData.product ||
      !newPurchaseFormData.vendor ||
      !newPurchaseFormData.quantity ||
      !newPurchaseFormData.cost_per_unit ||
      !newPurchaseFormData.purchase_date
    ) {
      toast.error("Please fill all fields");
      return;
    }

    const method = isEditMode ? "PUT" : "POST";
    const url =
      isEditMode && newPurchaseFormData.id
        ? `${API_BASE_URL}wholesalepurchases/${newPurchaseFormData.id}/`
        : `${API_BASE_URL}wholesalepurchases/`;

    const formData = new FormData();
    formData.append(
      "product",
      String(
        typeof newPurchaseFormData.product === "object"
          ? newPurchaseFormData.product.id
          : newPurchaseFormData.product
      )
    );
    formData.append(
      "vendor",
      String(
        typeof newPurchaseFormData.vendor === "object"
          ? newPurchaseFormData.vendor.id
          : newPurchaseFormData.vendor
      )
    );
    formData.append("quantity", String(newPurchaseFormData.quantity));
    formData.append("cost_per_unit", String(newPurchaseFormData.cost_per_unit));
    formData.append("purchase_date", String(newPurchaseFormData.purchase_date));

    try {
      await axios({
        method,
        url,
        data: formData,
        headers: authHeadersFormData.headers,
      });
      setIsAddPurchaseModalOpen(false);
      setIsEditMode(false);
      toast.success(isEditMode ? "Purchase updated!" : "Purchase added!");
      fetchData();
    } catch (error) {
      console.error("Error saving purchase:", error);
      toast.error("Failed to save purchase.");
    }
  };

  const handleEditPurchaseClick = (purchase: WholesalePurchase) => {
    setNewPurchaseFormData({
      id: purchase.id,
      product:
        typeof purchase.product === "object"
          ? purchase.product.id
          : purchase.product,
      vendor:
        typeof purchase.vendor === "object"
          ? purchase.vendor.id
          : purchase.vendor,
      quantity: purchase.quantity,
      cost_per_unit: purchase.cost_per_unit,
      purchase_date: purchase.purchase_date,
    });
    setIsEditMode(true);
    setIsAddPurchaseModalOpen(true);
  };

  const handleDeletePurchase = async (id: number) => {
    if (!window.confirm("Delete this purchase? This action cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE_URL}wholesalepurchases/${id}/`, authHeaders);
      toast.success("Purchase deleted!");
      fetchData();
    } catch {
      toast.error("Delete failed!");
    }
  };

  const setPurchaseDateToToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setNewPurchaseFormData({ ...newPurchaseFormData, purchase_date: today });
  };

  const totalStockValue = products.reduce((sum, p) => {
    const stock = Number(p.stock_quantity || 0);
    const cost = parseFloat(p.wholesale_cost || "0");
    return sum + stock * cost;
  }, 0);

  const potentialRevenue = products.reduce((sum, p) => {
    const stock = Number(p.stock_quantity || 0);
    const price = parseFloat(p.retail_price || "0");
    return sum + stock * price;
  }, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen max-w-7xl mx-auto">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="text-green-600 w-6 h-6" /> Inventory Management
        </h1>
        <Button
          onClick={() => {
            setNewPurchaseFormData({
              product: "",
              vendor: "",
              quantity: 0,
              cost_per_unit: "",
              purchase_date: "",
            });
            setIsEditMode(false);
            setIsAddPurchaseModalOpen(true);
          }}
          className="bg-black hover:bg-gray-800 text-white w-full sm:w-auto flex items-center gap-2"
        >
          <PlusCircle size={20} /> Add Purchase
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{purchases.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">৳{totalStockValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">৳{potentialRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Inventory Overview</CardTitle>
          <CardDescription className="text-sm">Manage your wholesale purchases.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm">Loading purchases...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Product</TableHead>
                    <TableHead className="text-xs sm:text-sm">Vendor</TableHead>
                    <TableHead className="text-xs sm:text-sm">Quantity</TableHead>
                    <TableHead className="text-xs sm:text-sm">Cost/Unit</TableHead>
                    <TableHead className="text-xs sm:text-sm">Total Cost</TableHead>
                    <TableHead className="text-xs sm:text-sm">Purchase Date</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm">
                        No wholesale purchases found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="text-xs sm:text-sm">{getProductName(purchase.product)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{getVendorName(purchase.vendor)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{purchase.quantity}</TableCell>
                        <TableCell className="text-xs sm:text-sm">৳{parseFloat(purchase.cost_per_unit).toLocaleString()}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          ৳{(purchase.quantity * parseFloat(purchase.cost_per_unit)).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{purchase.purchase_date}</TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setViewPurchase(purchase);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditPurchaseClick(purchase)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeletePurchase(purchase.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddPurchaseModalOpen} onOpenChange={setIsAddPurchaseModalOpen}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{isEditMode ? "Edit Purchase" : "Add New Purchase"}</DialogTitle>
            <DialogDescription className="text-sm">
              {isEditMode
                ? "Make changes to this purchase here."
                : "Add a new wholesale product purchase."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,2fr] items-center gap-4">
              <Label htmlFor="product" className="text-right text-sm">
                Product
              </Label>
              <Select
                value={String(newPurchaseFormData.product || "")}
                onValueChange={(value) =>
                  setNewPurchaseFormData({ ...newPurchaseFormData, product: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,2fr] items-center gap-4">
              <Label htmlFor="vendor" className="text-right text-sm">
                Vendor
              </Label>
              <Select
                value={String(newPurchaseFormData.vendor || "")}
                onValueChange={(value) =>
                  setNewPurchaseFormData({ ...newPurchaseFormData, vendor: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={String(vendor.id)}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,2fr] items-center gap-4">
              <Label htmlFor="quantity" className="text-right text-sm">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={newPurchaseFormData.quantity || ""}
                onChange={(e) =>
                  setNewPurchaseFormData({ ...newPurchaseFormData, quantity: Number(e.target.value) })
                }
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,2fr] items-center gap-4">
              <Label htmlFor="cost_per_unit" className="text-right text-sm">
                Cost Per Unit (৳)
              </Label>
              <Input
                id="cost_per_unit"
                type="number"
                step="0.01"
                value={newPurchaseFormData.cost_per_unit || ""}
                onChange={(e) =>
                  setNewPurchaseFormData({ ...newPurchaseFormData, cost_per_unit: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,2fr] items-center gap-4">
              <Label htmlFor="purchase_date" className="text-right text-sm">
                Purchase Date
              </Label>
              <div className="flex gap-2">
                <Input
                  id="purchase_date"
                  type="date"
                  value={newPurchaseFormData.purchase_date || ""}
                  onChange={(e) =>
                    setNewPurchaseFormData({ ...newPurchaseFormData, purchase_date: e.target.value })
                  }
                  className="flex-grow text-sm"
                />
                <Button variant="outline" onClick={setPurchaseDateToToday} className="w-full sm:w-auto">
                  Today
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsAddPurchaseModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSavePurchase} className="w-full sm:w-auto">
              {isEditMode ? "Save Changes" : "Add Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Purchase Details</DialogTitle>
            <DialogDescription className="text-sm">
              Detailed information about this wholesale purchase.
            </DialogDescription>
          </DialogHeader>
          {viewPurchase && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Label className="font-semibold text-sm">Product:</Label>
                <span className="text-sm">{getProductName(viewPurchase.product)}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Label className="font-semibold text-sm">Vendor:</Label>
                <span className="text-sm">{getVendorName(viewPurchase.vendor)}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Label className="font-semibold text-sm">Quantity:</Label>
                <span className="text-sm">{viewPurchase.quantity}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Label className="font-semibold text-sm">Cost Per Unit:</Label>
                <span className="text-sm">৳{parseFloat(viewPurchase.cost_per_unit).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Label className="font-semibold text-sm">Total Cost:</Label>
                <span className="text-sm">
                  ৳{(viewPurchase.quantity * parseFloat(viewPurchase.cost_per_unit)).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Label className="font-semibold text-sm">Purchase Date:</Label>
                <span className="text-sm">{viewPurchase.purchase_date}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManager;