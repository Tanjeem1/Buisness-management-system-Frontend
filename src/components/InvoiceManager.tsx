import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Filter, Download, Eye, Clock, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import axios from "axios";

// API Configuration
const API_BASE_URL = "https://pabnabazar.live/api";
const AUTH_TOKEN = "Token 2418fedd927fddbd0a1de8c5f2b106a7b0315a2d";

// Interfaces (kept flexible)
interface Product {
  id: number;
  name: string;
  retail_price: string;
  wholesale_cost?: string;
  stock_quantity?: number;
}

interface Customer {
  id: number;
  shop_name?: string;
  name?: string;
}

interface Invoice {
  id?: number;
  invoice_number?: string;
  invoice_id?: string;
  sale?: number;
  customer?: number | { id?: number; shop_name?: string; name?: string };
  total_amount?: string | number;
  invoice_date?: string;
  date?: string;
  created_at?: string;
  due_date?: string;
  status?: string;
  // backend may contain other keys - we don't require them
}

interface InvoiceItem {
  productId: string;
  quantity: number;
  price: number;
}

const InvoiceManager = () => {
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { productId: "", quantity: 1, price: 0 }
  ]);

  // View modal
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const authHeaders = {
    Authorization: AUTH_TOKEN,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, customersRes, invoicesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products/`, { headers: authHeaders }),
        axios.get(`${API_BASE_URL}/customers/`, { headers: authHeaders }),
        // Use /sales/ as the canonical source for invoices (per our earlier diagnosis)
        axios.get(`${API_BASE_URL}/sales/`, { headers: authHeaders }),
      ]);

      setProducts(productsRes.data || []);
      setCustomers(customersRes.data || []);
      setInvoices(invoicesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load data. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  // Utility helpers to render fields robustly

  const getInvoiceIdValue = (invoice: Invoice) => {
    // prefer numeric id, else invoice_number/invoice_id, else fallback N/A
    if (invoice.id !== undefined && invoice.id !== null) return String(invoice.id);
    if (invoice.invoice_number) return String(invoice.invoice_number);
    if (invoice.invoice_id) return String(invoice.invoice_id);
    if (invoice.sale !== undefined && invoice.sale !== null) return String(invoice.sale);
    return "N/A";
  };

  const getCustomerName = (invoice: Invoice) => {
    const c = invoice.customer;
    // If backend returns object with shop_name or name
    if (c && typeof c === "object") {
      return (c.shop_name || c.name || "N/A");
    }
    // If backend returns id (number)
    if (c && (typeof c === "number" || /^\d+$/.test(String(c)))) {
      const idNum = Number(c);
      const found = customers.find((cust) => Number(cust.id) === idNum);
      if (found) return found.shop_name || found.name || `Customer #${found.id}`;
      return `Customer #${idNum}`;
    }
    return "N/A";
  };

  const formatDateSafe = (invoice: Invoice, preferKeys = ["invoice_date", "date", "created_at"]) => {
    for (const k of preferKeys) {
      // @ts-ignore
      const v = invoice[k];
      if (v) {
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d.toLocaleDateString();
        // Try ISO partials
        try {
          const parsed = new Date(String(v));
          if (!isNaN(parsed.getTime())) return parsed.toLocaleDateString();
        } catch (e) {}
      }
    }
    return "Invalid Date";
  };

  // Invoice form handlers
  const handleProductChange = (index: number, productId: string) => {
    setInvoiceItems(prevItems => {
      const updatedItems = [...prevItems];
      const product = products.find(p => p.id === parseInt(productId));
      if (product) {
        const price = parseFloat(product.retail_price as any) || 0;
        updatedItems[index] = {
          productId: productId,
          quantity: updatedItems[index].quantity || 1,
          price: price
        };
      } else {
        updatedItems[index].productId = productId;
      }
      return updatedItems;
    });
  };

  const handleQuantityChange = (index: number, quantity: string) => {
    setInvoiceItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index].quantity = parseInt(quantity) || 1;
      return updatedItems;
    });
  };

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { productId: "", quantity: 1, price: 0 }]);
  };

  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    if (invoiceItems.some(item => !item.productId || item.quantity < 1)) {
      alert("Please complete all invoice items");
      return;
    }

    const totalAmount = calculateTotal();

    if (totalAmount <= 0) {
      alert("Invoice total must be greater than 0");
      return;
    }

    const payload = {
      customer: parseInt(selectedCustomerId),
      user: 1, // adjust if you have user context
      total_amount: parseFloat(totalAmount.toFixed(2)),
      is_paid: false,
      status: "pending",
      items: invoiceItems.map(item => ({
        product: parseInt(item.productId),
        quantity: item.quantity,
        unit_price: parseFloat(item.price.toFixed(2)),
        line_total: parseFloat((item.price * item.quantity).toFixed(2))
      })),
      due_date: dueDate || null
    };

    setIsLoading(true);
    try {
      // POST to /sales/ (backend expected this)
      const response = await axios.post(`${API_BASE_URL}/sales/`, payload, { headers: authHeaders });
      const newInvoice = response.data;

      // If backend returns nothing (204), refetch; otherwise prepend returned invoice
      if (!newInvoice || Object.keys(newInvoice).length === 0) {
        // fallback: refetch full list
        await fetchAllData();
      } else {
        setInvoices(prev => [newInvoice, ...prev]);
      }

      alert("Invoice created successfully!");

      // Reset form
      setIsCreateInvoiceDialogOpen(false);
      setSelectedCustomerId("");
      setDueDate("");
      setInvoiceItems([{ productId: "", quantity: 1, price: 0 }]);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message || "Failed to create invoice";
      alert(`Error creating invoice: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Action handlers (View, Download, Delete)
  const handleViewInvoice = async (invoice: Invoice) => {
    const id = invoice.id ?? (invoice.invoice_number ? invoice.invoice_number : null);
    if (!id) {
      alert("Cannot view invoice: missing id");
      return;
    }

    setIsLoading(true);
    try {
      // Try the most likely detail endpoint
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
        // As a fallback, show the invoice object we already have
        setViewInvoice(invoice);
      } else {
        setViewInvoice(fetched);
      }
      setIsViewDialogOpen(true);
    } catch (err) {
      console.error("View invoice error:", err);
      alert("Failed to fetch invoice details.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBlob = (blob: Blob, filename = "invoice.pdf") => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    const id = invoice.id ?? (invoice.invoice_number ? invoice.invoice_number : null);
    if (!id) {
      alert("Cannot download invoice: missing id");
      return;
    }

    setIsLoading(true);
    try {
      // Try a few endpoint patterns that backends commonly use for download/PDF
      const endpointsToTry = [
        `${API_BASE_URL}/sales/${id}/download/`,
        `${API_BASE_URL}/invoices/${id}/download/`,
        `${API_BASE_URL}/sales/${id}/pdf/`,
        `${API_BASE_URL}/invoices/${id}/pdf/`,
      ];

      let downloaded = false;
      for (const url of endpointsToTry) {
        try {
          const res = await axios.get(url, { headers: authHeaders, responseType: "blob" });
          // If the response is JSON (error), skip
          if (res.data instanceof Blob) {
            downloadBlob(res.data, `invoice_${getInvoiceIdValue(invoice)}.pdf`);
            downloaded = true;
            break;
          }
        } catch (err: any) {
          // try next
        }
      }

      if (!downloaded) {
        alert("No download endpoint found on server. Ask backend to provide /sales/{id}/download/ or /sales/{id}/pdf/ endpoint.");
      }
    } catch (err) {
      console.error("Download invoice error:", err);
      alert("Failed to download invoice.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    const id = invoice.id ?? (invoice.invoice_number ? invoice.invoice_number : null);
    if (!id) {
      alert("Cannot delete invoice: missing id");
      return;
    }

    if (!confirm(`Are you sure you want to delete invoice ${getInvoiceIdValue(invoice)}? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Try typical delete endpoints
      const endpointsToTry = [
        `${API_BASE_URL}/sales/${id}/`,
        `${API_BASE_URL}/invoices/${id}/`,
      ];

      let success = false;
      for (const url of endpointsToTry) {
        try {
          const res = await axios.delete(url, { headers: authHeaders });
          if (res.status >= 200 && res.status < 300) {
            success = true;
            break;
          }
        } catch (err: any) {
          // try next
        }
      }

      if (success) {
        // Remove from local state
        setInvoices(prev => prev.filter(inv => getInvoiceIdValue(inv) !== getInvoiceIdValue(invoice)));
        alert("Invoice deleted successfully.");
      } else {
        // Fallback: refetch full list
        await fetchAllData();
        alert("Invoice deleted (refetched list).");
      }
    } catch (err) {
      console.error("Delete invoice error:", err);
      alert("Failed to delete invoice. Please check if the backend supports DELETE /sales/{id}/.");
    } finally {
      setIsLoading(false);
    }
  };

  // Status helpers
  const getStatusIcon = (status?: string) => {
    if (!status) return null;
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'secondary';
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const paidInvoices = invoices.filter(i => String(i.status || "").toLowerCase() === 'paid' || String(i.status || "").toLowerCase() === 'completed');
  const pendingInvoices = invoices.filter(i => String(i.status || "").toLowerCase() === 'pending');
  const overdueInvoices = invoices.filter(i => String(i.status || "").toLowerCase() === 'overdue');

  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + parseFloat(String(inv.total_amount || '0')), 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + parseFloat(String(inv.total_amount || '0')), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-muted-foreground">Create and manage customer invoices</p>
        </div>
        <Dialog open={isCreateInvoiceDialogOpen} onOpenChange={setIsCreateInvoiceDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>
              <FileText className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Generate a professional invoice for your customer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.shop_name || customer.name || `Customer #${customer.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Invoice Items *</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium">
                    <span className="col-span-5">Product</span>
                    <span className="col-span-2 text-center">Quantity</span>
                    <span className="col-span-2 text-right">Price</span>
                    <span className="col-span-2 text-right">Total</span>
                    <span className="col-span-1"></span>
                  </div>

                  {invoiceItems.map((item, index) => {
                    const itemTotal = (item.price || 0) * (item.quantity || 1);

                    return (
                      <div key={index} className="grid grid-cols-12 gap-2">
                        <div className="col-span-5">
                          <Select
                            value={item.productId || ""}
                            onValueChange={(value) => handleProductChange(index, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={String(product.id)}>
                                  {product.name} - ৳{product.retail_price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          className="col-span-2 text-center"
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                        />
                        <Input
                          className="col-span-2 text-right"
                          value={(item.price || 0).toFixed(2)}
                          readOnly
                        />
                        <Input
                          className="col-span-2 text-right"
                          value={itemTotal.toFixed(2)}
                          readOnly
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="col-span-1"
                          onClick={() => removeInvoiceItem(index)}
                          disabled={invoiceItems.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}

                  <Button variant="outline" size="sm" onClick={addInvoiceItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="flex justify-end items-center gap-2 pt-4 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold">৳{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateInvoiceDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateInvoice}
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoice Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              Collection rate: {invoices.length ? ((paidInvoices.length / invoices.length) * 100).toFixed(0) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ৳{pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ৳{overdueAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>Manage all customer invoices</CardDescription>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." className="pl-8" />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" onClick={() => { /* implement export action if needed */ }}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {isLoading ? "Loading..." : "No invoices found"}
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice, idx) => (
                  <TableRow key={invoice.id ?? invoice.invoice_number ?? idx}>
                    <TableCell className="font-medium">{getInvoiceIdValue(invoice)}</TableCell>
                    <TableCell>{getCustomerName(invoice)}</TableCell>
                    <TableCell>{formatDateSafe(invoice, ["invoice_date", "date", "created_at"])}</TableCell>
                    <TableCell>{formatDateSafe(invoice, ["due_date"])}</TableCell>
                    <TableCell>৳{parseFloat(String(invoice.total_amount || '0')).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        <Badge variant={getStatusColor(invoice.status) as any}>
                          {invoice.status || "unknown"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleViewInvoice(invoice)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(invoice)}>
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteInvoice(invoice)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View invoice dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>Details from server (if available)</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewInvoice ? (
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {getInvoiceIdValue(viewInvoice)}</div>
                <div><strong>Customer:</strong> {getCustomerName(viewInvoice)}</div>
                <div><strong>Date:</strong> {formatDateSafe(viewInvoice)}</div>
                <div><strong>Due Date:</strong> {formatDateSafe(viewInvoice, ["due_date"])}</div>
                <div><strong>Amount:</strong> ৳{parseFloat(String(viewInvoice.total_amount || '0')).toLocaleString()}</div>
                <div><strong>Status:</strong> {viewInvoice.status || "N/A"}</div>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">{JSON.stringify(viewInvoice, null, 2)}</pre>
              </div>
            ) : (
              <div>No details available</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceManager;