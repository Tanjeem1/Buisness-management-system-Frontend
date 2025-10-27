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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Vendor Management
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your tea suppliers and wholesalers</p>
        </div>
        <Dialog open={isAddVendorDialogOpen} onOpenChange={setIsAddVendorDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto flex items-center gap-2">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-[90vw] sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add New Vendor</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">Add a new tea supplier to your vendor database.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">Vendor Name</Label>
                  <Input id="name" value={newVendor.name} onChange={handleInputChange} placeholder="Enter vendor name" className="text-sm sm:text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person" className="text-sm sm:text-base">Contact Person</Label>
                  <Input id="contact_person" value={newVendor.contact_person} onChange={handleInputChange} placeholder="Enter contact person" className="text-sm sm:text-base" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm sm:text-base">Phone</Label>
                  <Input id="phone_number" value={newVendor.phone_number} onChange={handleInputChange} placeholder="Enter phone number" className="text-sm sm:text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                  <Input id="email" type="email" value={newVendor.email} onChange={handleInputChange} placeholder="Enter email address" className="text-sm sm:text-base" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm sm:text-base">Address</Label>
                <Textarea id="address" value={newVendor.address} onChange={handleInputChange} placeholder="Enter full address" className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialties" className="text-sm sm:text-base">Specialties</Label>
                <Input id="specialties" value={newVendor.specialties} onChange={handleInputChange} placeholder="e.g., Ceylon Black Tea, Earl Grey" className="text-sm sm:text-base" />
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsAddVendorDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleAddVendor} className="w-full sm:w-auto">Add Vendor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vendor Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{vendors.length}</div>
            <p className="text-xs text-muted-foreground">Registered suppliers</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{vendors.filter(v => v.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Currently supplying</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{vendors.reduce((sum, v) => sum + v.total_purchases, 0)}</div>
            <p className="text-xs text-muted-foreground">Across all vendors</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{vendors.length > 0 ? (vendors.reduce((sum, v) => sum + parseFloat(v.rating), 0) / vendors.length).toFixed(1) : '0.0'}</div>
            <p className="text-xs text-muted-foreground">Overall satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor List */}
      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Vendor Directory</CardTitle>
          <CardDescription className="text-sm sm:text-base">Complete list of tea suppliers</CardDescription>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <Input placeholder="Search vendors..." className="pl-8 text-sm sm:text-base" />
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center gap-2">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <p className="text-sm sm:text-base text-center col-span-full">Loading vendors...</p>
            ) : vendors.map((vendor) => (
              <Card key={vendor.id} className="p-4 bg-white shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">{vendor.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{vendor.contact_person}</p>
                    </div>
                    <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'} className="text-xs sm:text-sm">
                      {vendor.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      <span>{vendor.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      <span>{vendor.email}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mt-0.5" />
                      <span>{vendor.address}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-medium">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                      {vendor.specialties.split(',').map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs sm:text-sm">
                          {specialty.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t text-xs sm:text-sm">
                    <div>
                      <span className="font-medium">Rating: </span>
                      <span className="text-yellow-600">★ {vendor.rating}</span>
                    </div>
                    <div>
                      <span className="font-medium">Purchases: </span>
                      <span>{vendor.total_purchases}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 flex items-center gap-2" onClick={() => openEditDialog(vendor)}>
                      <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1 flex items-center gap-2" onClick={() => openDeleteDialog(vendor)}>
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      Delete
                    </Button>
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
          <DialogContent className="w-full max-w-[90vw] sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Edit Vendor</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">Update the details for {editingVendor.name}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">Vendor Name</Label>
                  <Input id="name" value={editingVendor.name} onChange={handleInputChange} className="text-sm sm:text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person" className="text-sm sm:text-base">Contact Person</Label>
                  <Input id="contact_person" value={editingVendor.contact_person} onChange={handleInputChange} className="text-sm sm:text-base" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm sm:text-base">Phone</Label>
                  <Input id="phone_number" value={editingVendor.phone_number} onChange={handleInputChange} className="text-sm sm:text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                  <Input id="email" type="email" value={editingVendor.email} onChange={handleInputChange} className="text-sm sm:text-base" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm sm:text-base">Address</Label>
                <Textarea id="address" value={editingVendor.address} onChange={handleInputChange} className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialties" className="text-sm sm:text-base">Specialties</Label>
                <Input id="specialties" value={editingVendor.specialties} onChange={handleInputChange} className="text-sm sm:text-base" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rating" className="text-sm sm:text-base">Rating</Label>
                  <Input id="rating" type="number" step="0.1" value={editingVendor.rating} onChange={handleInputChange} className="text-sm sm:text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm sm:text-base">Status</Label>
                  <select id="status" value={editingVendor.status} onChange={(e) => setEditingVendor({...editingVendor, status: e.target.value})} className="w-full p-2 border rounded-md text-sm sm:text-base">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsEditVendorDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleUpdateVendor} className="w-full sm:w-auto">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {vendorToDelete && (
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="w-full max-w-[90vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">Are you sure you want to delete the vendor "{vendorToDelete.name}"? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteVendor} className="w-full sm:w-auto">Delete Vendor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VendorManager;