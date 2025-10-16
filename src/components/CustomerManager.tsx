import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Phone, Mail, MapPin, Search, Filter, Eye, DollarSign, ShoppingBag, Trash2, Edit } from "lucide-react";
import axios from "axios";

// Define a type for the customer object for better type safety
interface Customer {
  id: number;
  shop_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  address: string;
  shop_type: string;
  credit_limit: string;
  outstanding_amount: string;
  total_purchases: number;
  last_purchase: string | null;
  status: string;
}

const CustomerManager = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [isEditCustomerDialogOpen, setIsEditCustomerDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [newCustomer, setNewCustomer] = useState({
    shop_name: "", contact_person: "", phone_number: "", email: "", address: "", shop_type: "", credit_limit: "",
  });

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const API_URL = "https://pabnabazar.live/api/customers/";
  const AUTH_TOKEN = "Token 2418fedd927fddbd0a1de8c5f2b106a7b0315a2d";
  const authHeader = { headers: { 'Authorization': AUTH_TOKEN } };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(API_URL, authHeader);
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewCustomer((prev) => ({ ...prev, shop_type: e.target.value }));
  };

  const handleAddCustomer = async () => {
    const formData = new FormData();
    Object.entries(newCustomer).forEach(([key, value]) => { formData.append(key, value); });
    formData.append('outstanding_amount', '0');
    formData.append('total_purchases', '0');
    formData.append('status', 'active');
    try {
      await axios.post(API_URL, formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': AUTH_TOKEN } });
      fetchCustomers();
      setIsAddCustomerDialogOpen(false);
      setNewCustomer({ shop_name: "", contact_person: "", phone_number: "", email: "", address: "", shop_type: "", credit_limit: "" });
    } catch (error) {
       if (axios.isAxiosError(error) && error.response) { console.error("Error adding customer:", error.response.data); } 
       else { console.error("An unexpected error occurred:", error); }
    }
  };
  
  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditCustomerDialogOpen(true);
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingCustomer) return;
    const { id, value } = e.target;
    setEditingCustomer({ ...editingCustomer, [id]: value });
  };
  
  const handleEditSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     if (!editingCustomer) return;
    setEditingCustomer({ ...editingCustomer, shop_type: e.target.value });
  };
  
  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;
    
    const formData = new FormData();
    Object.entries(editingCustomer).forEach(([key, value]) => {
      // ✅ THIS IS THE FIX ✅
      // Use the nullish coalescing operator (??) to convert any null/undefined value to an empty string.
      // This prevents sending the literal string "null" to the backend for fields like 'last_purchase'.
      formData.append(key, String(value ?? ''));
    });
    
    try {
      await axios.put(`${API_URL}${editingCustomer.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': AUTH_TOKEN
        }
      });
      fetchCustomers();
      setIsEditCustomerDialogOpen(false);
      setEditingCustomer(null);
    } catch (error) {
       if (axios.isAxiosError(error) && error.response) {
        console.error("Error updating customer:", error.response.data);
      } else {
        console.error("An unexpected error occurred:", error);
      }
    }
  };
  
  const openDeleteDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteConfirmOpen(true);
  };
  
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      await axios.delete(`${API_URL}${customerToDelete.id}/`, authHeader);
      fetchCustomers();
      setIsDeleteConfirmOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
       if (axios.isAxiosError(error) && error.response) { console.error("Error deleting customer:", error.response.data); } 
       else { console.error("An unexpected error occurred:", error); }
    }
  };

  const getCreditUtilization = (outstanding: number, limit: number) => {
    if (!limit || limit === 0) return 0;
    return (outstanding / limit) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">Manage your retail partners and customers</p>
        </div>
        <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Add a new retail partner to your customer database.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="shop_name">Shop Name</Label><Input id="shop_name" value={newCustomer.shop_name} onChange={handleInputChange} placeholder="Enter shop name" /></div>
                <div className="space-y-2"><Label htmlFor="contact_person">Owner Name</Label><Input id="contact_person" value={newCustomer.contact_person} onChange={handleInputChange} placeholder="Enter owner name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="phone_number">Phone</Label><Input id="phone_number" value={newCustomer.phone_number} onChange={handleInputChange} placeholder="Enter phone number" /></div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={newCustomer.email} onChange={handleInputChange} placeholder="Enter email address" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="address">Address</Label><Textarea id="address" value={newCustomer.address} onChange={handleInputChange} placeholder="Enter full address" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop_type">Shop Type</Label>
                  <select id="shop_type" value={newCustomer.shop_type} onChange={handleSelectChange} className="w-full p-2 border rounded-md"><option value="">Select shop type</option><option value="Retail Shop">Retail Shop</option><option value="Tea Boutique">Tea Boutique</option><option value="Supermarket">Supermarket</option><option value="Corner Shop">Corner Shop</option></select>
                </div>
                <div className="space-y-2"><Label htmlFor="credit_limit">Credit Limit (৳)</Label><Input id="credit_limit" type="number" value={newCustomer.credit_limit} onChange={handleInputChange} placeholder="Enter credit limit" /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={() => setIsAddCustomerDialogOpen(false)} variant="outline">Cancel</Button><Button onClick={handleAddCustomer}>Add Customer</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
         <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Customers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{customers.length}</div><p className="text-xs text-muted-foreground">Registered partners</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Customers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{customers.filter(c => c.status === 'active').length}</div><p className="text-xs text-muted-foreground">Currently buying</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">৳{customers.reduce((sum, c) => sum + parseFloat(c.outstanding_amount || '0'), 0).toLocaleString()}</div><p className="text-xs text-muted-foreground">Total receivables</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">৳{customers.reduce((sum, c) => sum + parseFloat(c.credit_limit || '0'), 0).toLocaleString()}</div><p className="text-xs text-muted-foreground">Available credit</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>Complete list of retail partners</CardDescription>
           <div className="flex gap-2 pt-2">
            <div className="relative flex-1"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search customers..." className="pl-8" /></div>
            <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" />Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {customers.map((customer) => {
              const outstandingAmount = parseFloat(customer.outstanding_amount || '0');
              const creditLimit = parseFloat(customer.credit_limit || '0');
              const creditUtilization = getCreditUtilization(outstandingAmount, creditLimit);
              
              return (
                <Card key={customer.id} className="p-4 flex flex-col justify-between">
                  <div className="space-y-3">
                     <div className="flex items-start justify-between">
                      <div><h3 className="font-semibold text-lg">{customer.shop_name}</h3><p className="text-sm text-muted-foreground">{customer.contact_person}</p><Badge variant="outline" className="text-xs mt-1">{customer.shop_type}</Badge></div>
                      <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>{customer.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span>{customer.phone_number}</span></div>
                      <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><span>{customer.email}</span></div>
                      <div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /><span>{customer.address}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-1"><div className="flex items-center gap-1 text-sm"><ShoppingBag className="w-4 h-4 text-muted-foreground" /><span className="font-medium">Purchases:</span></div><p className="text-sm">{customer.total_purchases} orders</p></div>
                      <div className="space-y-1"><div className="flex items-center gap-1 text-sm"><DollarSign className="w-4 h-4 text-muted-foreground" /><span className="font-medium">Outstanding:</span></div><p className="text-sm">৳{outstandingAmount.toLocaleString()}</p></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span>Credit Utilization</span><span>{creditUtilization.toFixed(1)}%</span></div>
                      <div className="w-full bg-secondary h-2 rounded-full">
                        <div className={`h-2 rounded-full ${creditUtilization > 80 ? 'bg-destructive' : creditUtilization > 60 ? 'bg-yellow-500' : 'bg-primary'}`} style={{ width: `${Math.min(creditUtilization, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground"><span>৳0</span><span>৳{creditLimit.toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditDialog(customer)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => openDeleteDialog(customer)}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {editingCustomer && (
        <Dialog open={isEditCustomerDialogOpen} onOpenChange={setIsEditCustomerDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>Edit Customer</DialogTitle><DialogDescription>Update the details for {editingCustomer.shop_name}.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="shop_name">Shop Name</Label><Input id="shop_name" value={editingCustomer.shop_name} onChange={handleEditInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="contact_person">Owner Name</Label><Input id="contact_person" value={editingCustomer.contact_person} onChange={handleEditInputChange} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="phone_number">Phone</Label><Input id="phone_number" value={editingCustomer.phone_number} onChange={handleEditInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={editingCustomer.email} onChange={handleEditInputChange} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="address">Address</Label><Textarea id="address" value={editingCustomer.address} onChange={handleEditInputChange} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop_type">Shop Type</Label>
                  <select id="shop_type" value={editingCustomer.shop_type} onChange={handleEditSelectChange} className="w-full p-2 border rounded-md"><option value="">Select shop type</option><option value="Retail Shop">Retail Shop</option><option value="Tea Boutique">Tea Boutique</option><option value="Supermarket">Supermarket</option><option value="Corner Shop">Corner Shop</option></select>
                </div>
                <div className="space-y-2"><Label htmlFor="credit_limit">Credit Limit (৳)</Label><Input id="credit_limit" type="number" value={editingCustomer.credit_limit} onChange={handleEditInputChange} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={() => setIsEditCustomerDialogOpen(false)} variant="outline">Cancel</Button><Button onClick={handleUpdateCustomer}>Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {customerToDelete && (
         <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle><DialogDescription>Are you sure you want to delete the customer "{customerToDelete.shop_name}"? This action cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteCustomer}>Delete Customer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CustomerManager;