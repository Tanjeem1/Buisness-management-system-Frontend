import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Phone, Mail, MapPin, Search, Filter, Edit, Trash2 } from "lucide-react";
import axios from "axios";

// Interface based on the backend API response
interface Vendor {
  id: number;
  name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  address: string;
  specialties: string; // API sends a string, e.g., "Tea, Coffee"
  rating: string;
  total_purchases: number;
  last_purchase: string | null;
  status: string;
}

const VendorManager = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddVendorDialogOpen, setIsAddVendorDialogOpen] = useState(false);
  const [isEditVendorDialogOpen, setIsEditVendorDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [newVendor, setNewVendor] = useState({
    name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    address: "",
    specialties: "",
  });

  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  const API_URL = "https://pabnabazar.live/api/vendors/";
  const AUTH_TOKEN = "Token 2418fedd927fddbd0a1de8c5f2b106a7b0315a2d";
  const authHeader = { headers: { 'Authorization': AUTH_TOKEN } };

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, authHeader);
      setVendors(response.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (editingVendor) {
      setEditingVendor({ ...editingVendor, [id]: value });
    } else {
      setNewVendor((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleAddVendor = async () => {
    const formData = new FormData();
    Object.entries(newVendor).forEach(([key, value]) => {
      formData.append(key, value);
    });
    // Add default values as per API requirements for new vendors
    formData.append('rating', '0');
    formData.append('status', 'active');
    formData.append('total_purchases', '0');

    try {
      await axios.post(API_URL, formData, {
        headers: { ...authHeader.headers, 'Content-Type': 'multipart/form-data' }
      });
      fetchVendors();
      setIsAddVendorDialogOpen(false);
      setNewVendor({ name: "", contact_person: "", phone_number: "", email: "", address: "", specialties: "" });
    } catch (error) {
      console.error("Error adding vendor:", error);
    }
  };

  const openEditDialog = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsEditVendorDialogOpen(true);
  };

  const handleUpdateVendor = async () => {
    if (!editingVendor) return;

    const formData = new FormData();
    Object.entries(editingVendor).forEach(([key, value]) => {
      // ✅ THIS IS THE FIX ✅
      // Explicitly convert every value to a string to satisfy FormData
      formData.append(key, String(value ?? ''));
    });

    try {
      await axios.put(`${API_URL}${editingVendor.id}/`, formData, {
         headers: { ...authHeader.headers, 'Content-Type': 'multipart/form-data' }
      });
      fetchVendors();
      setIsEditVendorDialogOpen(false);
      setEditingVendor(null);
    } catch (error) {
      console.error("Error updating vendor:", error);
    }
  };

  const openDeleteDialog = (vendor: Vendor) => {
    setVendorToDelete(vendor);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      await axios.delete(`${API_URL}${vendorToDelete.id}/`, authHeader);
      fetchVendors();
      setIsDeleteConfirmOpen(false);
      setVendorToDelete(null);
    } catch (error) {
      console.error("Error deleting vendor:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Management</h2>
          <p className="text-muted-foreground">Manage your tea suppliers and wholesalers</p>
        </div>
        <Dialog open={isAddVendorDialogOpen} onOpenChange={setIsAddVendorDialogOpen}>
          <DialogTrigger asChild><Button><UserPlus className="w-4 h-4 mr-2" />Add Vendor</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>Add New Vendor</DialogTitle><DialogDescription>Add a new tea supplier to your vendor database.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="name">Vendor Name</Label><Input id="name" value={newVendor.name} onChange={handleInputChange} placeholder="Enter vendor name" /></div>
                <div className="space-y-2"><Label htmlFor="contact_person">Contact Person</Label><Input id="contact_person" value={newVendor.contact_person} onChange={handleInputChange} placeholder="Enter contact person" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="phone_number">Phone</Label><Input id="phone_number" value={newVendor.phone_number} onChange={handleInputChange} placeholder="Enter phone number" /></div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={newVendor.email} onChange={handleInputChange} placeholder="Enter email address" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="address">Address</Label><Textarea id="address" value={newVendor.address} onChange={handleInputChange} placeholder="Enter full address" /></div>
              <div className="space-y-2"><Label htmlFor="specialties">Specialties</Label><Input id="specialties" value={newVendor.specialties} onChange={handleInputChange} placeholder="e.g., Ceylon Black Tea, Earl Grey" /></div>
            </div>
            <DialogFooter><Button onClick={handleAddVendor}>Add Vendor</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vendor Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Vendors</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{vendors.length}</div><p className="text-xs text-muted-foreground">Registered suppliers</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Vendors</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{vendors.filter(v => v.status === 'active').length}</div><p className="text-xs text-muted-foreground">Currently supplying</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Purchases</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{vendors.reduce((sum, v) => sum + v.total_purchases, 0)}</div><p className="text-xs text-muted-foreground">Across all vendors</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Rating</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{vendors.length > 0 ? (vendors.reduce((sum, v) => sum + parseFloat(v.rating), 0) / vendors.length).toFixed(1) : '0.0'}</div><p className="text-xs text-muted-foreground">Overall satisfaction</p></CardContent></Card>
      </div>

      {/* Vendor List */}
      <Card>
        <CardHeader><CardTitle>Vendor Directory</CardTitle><CardDescription>Complete list of tea suppliers</CardDescription>
          <div className="flex gap-2 pt-2">
            <div className="relative flex-1"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search vendors..." className="pl-8" /></div>
            <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" />Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading ? (<p>Loading vendors...</p>) : vendors.map((vendor) => (
              <Card key={vendor.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div><h3 className="font-semibold text-lg">{vendor.name}</h3><p className="text-sm text-muted-foreground">{vendor.contact_person}</p></div>
                    <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>{vendor.status}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span>{vendor.phone_number}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><span>{vendor.email}</span></div>
                    <div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /><span>{vendor.address}</span></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                      {vendor.specialties.split(',').map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{specialty.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm"><span className="font-medium">Rating: </span><span className="text-yellow-600">★ {vendor.rating}</span></div>
                    <div className="text-sm"><span className="font-medium">Purchases: </span><span>{vendor.total_purchases}</span></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditDialog(vendor)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => openDeleteDialog(vendor)}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Vendor Dialog */}
      {editingVendor && (
        <Dialog open={isEditVendorDialogOpen} onOpenChange={setIsEditVendorDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>Edit Vendor</DialogTitle><DialogDescription>Update the details for {editingVendor.name}.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="name">Vendor Name</Label><Input id="name" value={editingVendor.name} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="contact_person">Contact Person</Label><Input id="contact_person" value={editingVendor.contact_person} onChange={handleInputChange} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="phone_number">Phone</Label><Input id="phone_number" value={editingVendor.phone_number} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={editingVendor.email} onChange={handleInputChange} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="address">Address</Label><Textarea id="address" value={editingVendor.address} onChange={handleInputChange} /></div>
              <div className="space-y-2"><Label htmlFor="specialties">Specialties</Label><Input id="specialties" value={editingVendor.specialties} onChange={handleInputChange} /></div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><Label htmlFor="rating">Rating</Label><Input id="rating" type="number" step="0.1" value={editingVendor.rating} onChange={handleInputChange} /></div>
                 <div className="space-y-2"><Label htmlFor="status">Status</Label>
                    <select id="status" value={editingVendor.status} onChange={(e) => setEditingVendor({...editingVendor, status: e.target.value})} className="w-full p-2 border rounded-md">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                 </div>
              </div>
            </div>
            <DialogFooter><Button onClick={() => setIsEditVendorDialogOpen(false)} variant="outline">Cancel</Button><Button onClick={handleUpdateVendor}>Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {vendorToDelete && (
         <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle><DialogDescription>Are you sure you want to delete the vendor "{vendorToDelete.name}"? This action cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteVendor}>Delete Vendor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VendorManager;