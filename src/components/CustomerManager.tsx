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
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your retail partners and customers</p>
        </div>
        <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-[90vw] sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add New Customer</DialogTitle>
              <DialogDescription className="text-sm">Add a new retail partner to your customer database.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="shop_name">Shop Name</Label><Input id="shop_name" value={newCustomer.shop_name} onChange={handleInputChange} placeholder="Enter shop name" className="text-sm" /></div>
                <div className="space-y-2"><Label htmlFor="contact_person">Owner Name</Label><Input id="contact_person" value={newCustomer.contact_person} onChange={handleInputChange} placeholder="Enter owner name" className="text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="phone_number">Phone</Label><Input id="phone_number" value={newCustomer.phone_number} onChange={handleInputChange} placeholder="Enter phone number" className="text-sm" /></div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={newCustomer.email} onChange={handleInputChange} placeholder="Enter email address" className="text-sm" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="address">Address</Label><Textarea id="address" value={newCustomer.address} onChange={handleInputChange} placeholder="Enter full address" className="text-sm" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop_type">Shop Type</Label>
                  <select id="shop_type" value={newCustomer.shop_type} onChange={handleSelectChange} className="w-full p-2 border rounded-md text-sm">
                    <option value="">Select shop type</option>
                    <option value="Retail Shop">Retail Shop</option>
                    <option value="Tea Boutique">Tea Boutique</option>
                    <option value="Supermarket">Supermarket</option>
                    <option value="Corner Shop">Corner Shop</option>
                  </select>
                </div>
                <div className="space-y-2"><Label htmlFor="credit_limit">Credit Limit (৳)</Label><Input id="credit_limit" type="number" value={newCustomer.credit_limit} onChange={handleInputChange} placeholder="Enter credit limit" className="text-sm" /></div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setIsAddCustomerDialogOpen(false)} variant="outline" className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleAddCustomer} className="w-full sm:w-auto">Add Customer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Customers</CardTitle></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">{customers.length}</div><p className="text-xs">Registered partners</p></CardContent></Card>
        <Card><CardHeader className="pbRotary 2"><CardTitle className="text-sm font-medium">Active Customers</CardTitle></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">{customers.filter(c => c.status === 'active').length}</div><p className="text-xs">Currently buying</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">৳{customers.reduce((sum, c) => sum + parseFloat(c.outstanding_amount || '0'), 0).toLocaleString()}</div><p className="text-xs">Total receivables</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">৳{customers.reduce((sum, c) => sum + parseFloat(c.credit_limit || '0'), 0).toLocaleString()}</div><p className="text-xs">Available credit</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Customer Directory</CardTitle>
          <CardDescription className="text-sm">Complete list of retail partners</CardDescription>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search customers..." className="pl-8 text-sm" /></div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto"><Filter className="w-4 h-4 mr-2" />Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap旁的4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {customers.map((customer) => {
              const outstandingAmount = parseFloat(customer.outstanding_amount || '0');
              const creditLimit = parseFloat(customer.credit_limit || '0');
              const creditUtilization = getCreditUtilization(outstandingAmount, creditLimit);
              
              return (
                <Card key={customer.id} className="p-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg">{customer.shop_name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{customer.contact_person}</p>
                        <Badge variant="outline" className="text-xs mt-1">{customer.shop_type}</Badge>
                      </div>
                      <Badge variant={customer.status === 'active' ? 'default' : 'secondary'} className="text-xs">{customer.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span>{customer.phone_number}</span></div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><span>{customer.email}</span></div>
                      <div className="flex items-start gap-2 text-xs sm:text-sm"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /><span>{customer.address}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-1"><div className="flex items-center gap-1 text-xs sm:text-sm"><ShoppingBag className="w-4 h-4 text-muted-foreground" /><span className="font-medium">Purchases:</span></div><p className="text-xs sm:text-sm">{customer.total_purchases} orders</p></div>
                      <div className="space-y-1"><div className="flex items-center gap-1 text-xs sm:text-sm"><DollarSign className="w-4 h-4 text-muted-foreground" /><span className="font-medium">Outstanding:</span></div><p className="text-xs sm:text-sm">৳{outstandingAmount.toLocaleString()}</p></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span>Credit Utilization</span><span>{creditUtilization.toFixed(1)}%</span></div>
                      <div className="w-full bg-secondary h-2 rounded-full">
                        <div className={`h-2 rounded-full ${creditUtilization > 80 ? 'bg-destructive' : creditUtilization > 60 ? 'bg-yellow-500' : 'bg-primary'}`} style={{ width: `${Math.min(creditUtilization, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground"><span>৳0</span><span>৳{creditLimit.toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditDialog(customer)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => openDeleteDialog(customer)}><Trash2 className="w-4 h-4 mr-2orme2" />Delete</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {editingCustomer && (
        <Dialog open={isEditCustomerDialogOpen} onOpenChange={setIsEditCustomerDialogOpen}>
          <DialogContent className="w-full max-w-[90vw] sm:max-w-[600px]">
            <DialogHeader><DialogTitle className="text-lg sm:text-xl">Edit Customer</DialogTitle><DialogDescription className="text-sm">Update the details for {editingCustomer.shop_name}.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="shop_name">Shop Name</Label><Input id="shop_name" value={editingCustomer.shop_name} onChange={handleEditInputChange} className="text-sm" /></div>
                <div className="space-y-2"><Label htmlFor="contact_person">Owner Name</Label><Input id="contact_person" value={editingCustomer.contact_person} onChange={handleEditInputChange} className="text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="phone_number">Phone</Label><Input id="phone_number" value={editingCustomer.phone_number} onChange={handleEditInputChange} className="text-sm" /></div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={editingCustomer.email} onChange={handleEditInputChange} className="text-sm" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="address">Address</Label><Textarea id="address" value={editingCustomer.address} onChange={handleEditInputChange} className="text-sm" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop_type">Shop Type</Label>
                  <select id="shop_type" value={editingCustomer.shop_type} onChange={handleEditSelectChange} className="w-full p-2 border rounded-md text-sm"><option value="">Select shop type</option><option value="Retail Shop">Retail Shop</option><option value="Tea Boutique">Tea Boutique</option><option value="Supermarket">Supermarket</option><option value="Corner Shop">Corner Shop</option></select>
                </div>
                <div className="space-y-2"><Label htmlFor="credit_limit">Credit Limit (৳)</Label><Input id="credit_limit" type="number" value={editingCustomer.credit_limit} onChange={handleEditInputChange} className="text-sm" /></div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2"><Button onClick={() => setIsEditCustomerDialogOpen(false)} variant="outline" className="w-full sm:w-auto">Cancel</Button><Button onClick={handleUpdateCustomer} className="w-full sm:w-auto">Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {customerToDelete && (
         <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="w-full max-w-[90vw] sm:max-w-[425px]">
            <DialogHeader><DialogTitle className="text-lg sm:text-xl">Confirm Deletion</DialogTitle><DialogDescription className="text-sm">Are you sure you want to delete the customer "{customerToDelete.shop_name}"? This action cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteCustomer} className="w-full sm:w-auto">Delete Customer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CustomerManager;