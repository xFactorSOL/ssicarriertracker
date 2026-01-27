# 📦 Shipper & Receiver Implementation Guide
## Adding Facilities Management to TMS Portal

**Created:** January 26, 2026  
**Feature:** Add shipper (pickup location) and receiver (delivery location) information to loads

---

## 🎯 Overview

Currently, loads only have **addresses** (origin/destination). This enhancement adds **facility information** (shippers and receivers) including:
- 🏢 Facility name (e.g., "Amazon Warehouse DC-12")
- 👤 Contact person and phone number
- ⏰ Hours of operation and appointment requirements
- 📋 Special instructions (gate codes, loading procedures)
- 📊 Performance tracking (avg loading/unloading time)

---

## 📋 Implementation Steps

### **STEP 1: Run Database Migration** ✅

1. Open Supabase SQL Editor
2. Run the SQL script: `/carrier-tracker/add-facilities-schema.sql`
3. Verify tables created:
   - ✅ `facilities` table
   - ✅ `loads` table updated with shipper/receiver columns
   - ✅ Triggers and RLS policies enabled

```bash
# Tables created:
# - facilities (shippers/receivers)
# - loads.shipper_id, loads.receiver_id (foreign keys)
# - loads.shipper_name, loads.shipper_contact_name, etc. (denormalized fields)
```

---

### **STEP 2: Update Load Form (Frontend)**

#### A. Update `LoadFormModal` State

Add shipper/receiver fields to `formData`:

```javascript
const [formData, setFormData] = useState({
  load_number: load?.load_number || '',
  customer_name: load?.customer_name || '',
  
  // ... existing origin/destination fields ...
  
  // NEW: Shipper fields
  shipper_id: load?.shipper_id || null,
  shipper_name: load?.shipper_name || '',
  shipper_contact_name: load?.shipper_contact_name || '',
  shipper_contact_phone: load?.shipper_contact_phone || '',
  shipper_instructions: load?.shipper_instructions || '',
  shipper_appointment_time: load?.shipper_appointment_time || '',
  
  // NEW: Receiver fields
  receiver_id: load?.receiver_id || null,
  receiver_name: load?.receiver_name || '',
  receiver_contact_name: load?.receiver_contact_name || '',
  receiver_contact_phone: load?.receiver_contact_phone || '',
  receiver_instructions: load?.receiver_instructions || '',
  receiver_appointment_time: load?.receiver_appointment_time || '',
  
  // ... rest of fields ...
});
```

---

#### B. Add Facilities State Management

Add at the top of `CarrierTracker()` component:

```javascript
const [facilities, setFacilities] = useState([]);

const fetchFacilities = useCallback(async () => {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .order('facility_name');
    
    if (error) throw error;
    setFacilities(data || []);
  } catch (error) {
    console.error('Error fetching facilities:', error);
  }
}, []);

useEffect(() => {
  if (user && profile && isActive) {
    // ... existing fetchLoads, fetchCarriers, fetchCustomers ...
    const t4 = setTimeout(() => fetchFacilities(), 3000);
    return () => {
      // ... existing cleanup ...
      clearTimeout(t4);
    };
  }
}, [user, profile, isActive, fetchLoads, fetchCarriers, fetchCustomers, fetchFacilities]);
```

---

#### C. Update LoadFormModal JSX

Replace the Origin/Destination address sections with this enhanced version:

```jsx
{/* ==================================================== */}
{/* SHIPPER (PICKUP) SECTION */}
{/* ==================================================== */}
<div className="col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
    <Package className="w-4 h-4 text-[#003366]" />
    Shipper (Pickup Location)
  </h4>
  
  {/* Shipper Selection (dropdown or new facility) */}
  <div className="grid grid-cols-2 gap-3 mb-3">
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Select Existing Facility
      </label>
      <select
        value={formData.shipper_id || ''}
        onChange={(e) => {
          const facilityId = e.target.value;
          if (facilityId === 'new') {
            // Reset shipper fields for manual entry
            setFormData({
              ...formData,
              shipper_id: null,
              shipper_name: '',
              shipper_contact_name: '',
              shipper_contact_phone: '',
              shipper_instructions: ''
            });
          } else if (facilityId) {
            // Auto-fill from selected facility
            const facility = facilities.find(f => f.id === facilityId);
            if (facility) {
              setFormData({
                ...formData,
                shipper_id: facility.id,
                shipper_name: facility.facility_name,
                shipper_contact_name: facility.contact_name || '',
                shipper_contact_phone: facility.contact_phone || '',
                shipper_instructions: facility.special_instructions || '',
                origin_city: facility.city,
                origin_state: facility.state,
                origin_zip: facility.zip
              });
            }
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
      >
        <option value="">-- Select or Enter New --</option>
        <option value="new">+ Create New Facility</option>
        <optgroup label="Saved Facilities">
          {facilities
            .filter(f => f.city === formData.origin_city && f.state === formData.origin_state)
            .map(f => (
              <option key={f.id} value={f.id}>
                {f.facility_name} - {f.city}, {f.state}
              </option>
            ))}
        </optgroup>
        <optgroup label="All Facilities">
          {facilities.map(f => (
            <option key={f.id} value={f.id}>
              {f.facility_name} - {f.city}, {f.state}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  </div>
  
  {/* Shipper Details */}
  <div className="grid grid-cols-2 gap-3">
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Facility Name *
      </label>
      <input
        type="text"
        required
        value={formData.shipper_name}
        onChange={(e) => setFormData({...formData, shipper_name: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
        placeholder="e.g., Amazon Fulfillment DC-12"
      />
    </div>
    
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Contact Name
      </label>
      <input
        type="text"
        value={formData.shipper_contact_name}
        onChange={(e) => setFormData({...formData, shipper_contact_name: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
        placeholder="John Doe"
      />
    </div>
    
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Contact Phone
      </label>
      <input
        type="tel"
        value={formData.shipper_contact_phone}
        onChange={(e) => setFormData({...formData, shipper_contact_phone: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
        placeholder="(555) 123-4567"
      />
    </div>
    
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Appointment Time (Optional)
      </label>
      <input
        type="time"
        value={formData.shipper_appointment_time}
        onChange={(e) => setFormData({...formData, shipper_appointment_time: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
      />
    </div>
    
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Special Instructions
      </label>
      <textarea
        value={formData.shipper_instructions}
        onChange={(e) => setFormData({...formData, shipper_instructions: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
        placeholder="e.g., Gate code: 1234, Enter through dock door 5"
        rows="2"
      />
    </div>
  </div>
</div>

{/* Origin Address (existing section - keep as-is) */}
<div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
    <MapPin className="w-4 h-4 text-[#003366]" />
    Origin Address
  </h4>
  {/* ... existing origin fields ... */}
</div>

{/* ==================================================== */}
{/* RECEIVER (DELIVERY) SECTION */}
{/* ==================================================== */}
<div className="col-span-2 bg-green-50 p-4 rounded-lg border border-green-200">
  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
    <Building className="w-4 h-4 text-[#003366]" />
    Receiver (Delivery Location)
  </h4>
  
  {/* Receiver Selection */}
  <div className="grid grid-cols-2 gap-3 mb-3">
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Select Existing Facility
      </label>
      <select
        value={formData.receiver_id || ''}
        onChange={(e) => {
          const facilityId = e.target.value;
          if (facilityId === 'new') {
            setFormData({
              ...formData,
              receiver_id: null,
              receiver_name: '',
              receiver_contact_name: '',
              receiver_contact_phone: '',
              receiver_instructions: ''
            });
          } else if (facilityId) {
            const facility = facilities.find(f => f.id === facilityId);
            if (facility) {
              setFormData({
                ...formData,
                receiver_id: facility.id,
                receiver_name: facility.facility_name,
                receiver_contact_name: facility.contact_name || '',
                receiver_contact_phone: facility.contact_phone || '',
                receiver_instructions: facility.special_instructions || '',
                destination_city: facility.city,
                destination_state: facility.state,
                destination_zip: facility.zip
              });
            }
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
      >
        <option value="">-- Select or Enter New --</option>
        <option value="new">+ Create New Facility</option>
        <optgroup label="Saved Facilities">
          {facilities
            .filter(f => f.city === formData.destination_city && f.state === formData.destination_state)
            .map(f => (
              <option key={f.id} value={f.id}>
                {f.facility_name} - {f.city}, {f.state}
              </option>
            ))}
        </optgroup>
        <optgroup label="All Facilities">
          {facilities.map(f => (
            <option key={f.id} value={f.id}>
              {f.facility_name} - {f.city}, {f.state}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  </div>
  
  {/* Receiver Details (same structure as Shipper) */}
  <div className="grid grid-cols-2 gap-3">
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Facility Name *
      </label>
      <input
        type="text"
        required
        value={formData.receiver_name}
        onChange={(e) => setFormData({...formData, receiver_name: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
        placeholder="e.g., Walmart Distribution Center"
      />
    </div>
    
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Contact Name
      </label>
      <input
        type="text"
        value={formData.receiver_contact_name}
        onChange={(e) => setFormData({...formData, receiver_contact_name: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
        placeholder="Jane Smith"
      />
    </div>
    
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Contact Phone
      </label>
      <input
        type="tel"
        value={formData.receiver_contact_phone}
        onChange={(e) => setFormData({...formData, receiver_contact_phone: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
        placeholder="(555) 987-6543"
      />
    </div>
    
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Appointment Time (Optional)
      </label>
      <input
        type="time"
        value={formData.receiver_appointment_time}
        onChange={(e) => setFormData({...formData, receiver_appointment_time: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
      />
    </div>
    
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Special Instructions
      </label>
      <textarea
        value={formData.receiver_instructions}
        onChange={(e) => setFormData({...formData, receiver_instructions: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
        placeholder="e.g., Call 30 min before arrival, unload at dock 8"
        rows="2"
      />
    </div>
  </div>
</div>

{/* Destination Address (existing section - keep as-is) */}
<div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
    <MapPin className="w-4 h-4 text-[#003366]" />
    Destination Address
  </h4>
  {/* ... existing destination fields ... */}
</div>
```

---

#### D. Update Save Function

Modify the `handleSubmit` function to save shipper/receiver data and optionally create new facilities:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // Sanitize all input
    const sanitizedData = sanitizeFormData(formData);
    
    // ... existing validation and number parsing ...
    
    // NEW: If shipper_id is null but shipper_name exists, create facility
    if (!sanitizedData.shipper_id && sanitizedData.shipper_name) {
      const { data: newShipper, error: shipperError } = await supabase
        .from('facilities')
        .insert([{
          facility_name: sanitizedData.shipper_name,
          address_line1: sanitizedData.origin_city, // Or add street field
          city: sanitizedData.origin_city,
          state: sanitizedData.origin_state,
          zip: sanitizedData.origin_zip,
          contact_name: sanitizedData.shipper_contact_name,
          contact_phone: sanitizedData.shipper_contact_phone,
          special_instructions: sanitizedData.shipper_instructions,
          facility_type: 'warehouse',
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      
      if (!shipperError && newShipper) {
        sanitizedData.shipper_id = newShipper.id;
      }
    }
    
    // NEW: If receiver_id is null but receiver_name exists, create facility
    if (!sanitizedData.receiver_id && sanitizedData.receiver_name) {
      const { data: newReceiver, error: receiverError } = await supabase
        .from('facilities')
        .insert([{
          facility_name: sanitizedData.receiver_name,
          address_line1: sanitizedData.destination_city,
          city: sanitizedData.destination_city,
          state: sanitizedData.destination_state,
          zip: sanitizedData.destination_zip,
          contact_name: sanitizedData.receiver_contact_name,
          contact_phone: sanitizedData.receiver_contact_phone,
          special_instructions: sanitizedData.receiver_instructions,
          facility_type: 'warehouse',
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      
      if (!receiverError && newReceiver) {
        sanitizedData.receiver_id = newReceiver.id;
      }
    }
    
    // Save load with shipper/receiver info
    if (load) {
      const { error } = await supabase.from('loads').update(sanitizedData).eq('id', load.id);
      if (error) throw error;
      showToast('Load updated successfully', 'success');
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('loads').insert([{ 
        ...sanitizedData, 
        created_by: user.id, 
        status: 'dispatched' 
      }]);
      if (error) throw error;
      showToast('Load created successfully', 'success');
    }
    onSuccess();
  } catch (error) {
    console.error('Save error:', error);
    showToast(error.message, 'error');
  }
  setLoading(false);
};
```

---

#### E. Pass Facilities to LoadFormModal

Update the `LoadFormModal` invocation in `LoadsPage`:

```javascript
{showForm && (
  <LoadFormModal
    load={editingLoad}
    carriers={carriers}
    customers={customers}
    facilities={facilities}  {/* NEW */}
    onClose={() => { setShowForm(false); setEditingLoad(null); }}
    onSuccess={() => { onRefresh(); fetchFacilities(); setShowForm(false); setEditingLoad(null); }}  {/* NEW: refresh facilities */}
    showToast={showToast}
  />
)}
```

And update the function signature:

```javascript
function LoadFormModal({ load, carriers, customers, facilities, onClose, onSuccess, showToast }) {
  // ... rest of component ...
}
```

---

### **STEP 3: Display Shipper/Receiver in Load Details**

Update `LoadDetailModal` to show shipper/receiver info:

```jsx
<div className="grid grid-cols-2 gap-4">
  {/* Shipper Info Card */}
  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
      <Package className="w-4 h-4 text-[#003366]" />
      Shipper (Pickup)
    </h4>
    <div className="space-y-2 text-sm">
      <div>
        <span className="font-medium text-gray-600">Facility:</span>
        <span className="ml-2 text-gray-900">{load.shipper_name || 'Not specified'}</span>
      </div>
      {load.shipper_contact_name && (
        <div>
          <span className="font-medium text-gray-600">Contact:</span>
          <span className="ml-2 text-gray-900">{load.shipper_contact_name}</span>
        </div>
      )}
      {load.shipper_contact_phone && (
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3 text-gray-400" />
          <a href={`tel:${load.shipper_contact_phone}`} className="text-[#003366] hover:underline">
            {load.shipper_contact_phone}
          </a>
        </div>
      )}
      {load.shipper_appointment_time && (
        <div>
          <span className="font-medium text-gray-600">Appointment:</span>
          <span className="ml-2 text-gray-900">{load.shipper_appointment_time}</span>
        </div>
      )}
      {load.shipper_instructions && (
        <div className="mt-2 pt-2 border-t border-blue-200">
          <span className="font-medium text-gray-600 block mb-1">Instructions:</span>
          <p className="text-xs text-gray-600">{load.shipper_instructions}</p>
        </div>
      )}
    </div>
  </div>
  
  {/* Receiver Info Card */}
  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
      <Building className="w-4 h-4 text-[#003366]" />
      Receiver (Delivery)
    </h4>
    <div className="space-y-2 text-sm">
      <div>
        <span className="font-medium text-gray-600">Facility:</span>
        <span className="ml-2 text-gray-900">{load.receiver_name || 'Not specified'}</span>
      </div>
      {load.receiver_contact_name && (
        <div>
          <span className="font-medium text-gray-600">Contact:</span>
          <span className="ml-2 text-gray-900">{load.receiver_contact_name}</span>
        </div>
      )}
      {load.receiver_contact_phone && (
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3 text-gray-400" />
          <a href={`tel:${load.receiver_contact_phone}`} className="text-[#003366] hover:underline">
            {load.receiver_contact_phone}
          </a>
        </div>
      )}
      {load.receiver_appointment_time && (
        <div>
          <span className="font-medium text-gray-600">Appointment:</span>
          <span className="ml-2 text-gray-900">{load.receiver_appointment_time}</span>
        </div>
      )}
      {load.receiver_instructions && (
        <div className="mt-2 pt-2 border-t border-green-200">
          <span className="font-medium text-gray-600 block mb-1">Instructions:</span>
          <p className="text-xs text-gray-600">{load.receiver_instructions}</p>
        </div>
      )}
    </div>
  </div>
</div>
```

---

### **STEP 4: Add Facilities Management Page** (Optional but Recommended)

Create a new `FacilitiesPage` to manage all facilities:

```javascript
function FacilitiesPage({ onRefresh, showToast }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  
  const fetchFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('facility_name');
      
      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      showToast('Error loading facilities', 'error');
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchFacilities();
  }, []);
  
  const filteredFacilities = facilities.filter(f =>
    f.facility_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.city.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facilities</h2>
          <p className="text-gray-500">Manage shippers and receivers</p>
        </div>
        <button
          onClick={() => { setEditingFacility(null); setShowForm(true); }}
          className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Facility
        </button>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search facilities..."
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
        />
      </div>
      
      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFacilities.map(facility => (
          <div key={facility.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{facility.facility_name}</h3>
                <p className="text-sm text-gray-500">{facility.city}, {facility.state} {facility.zip}</p>
              </div>
              <button
                onClick={() => { setEditingFacility(facility); setShowForm(true); }}
                className="p-1 text-gray-400 hover:text-[#003366]"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            
            {facility.contact_name && (
              <div className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Contact:</span> {facility.contact_name}
              </div>
            )}
            
            {facility.contact_phone && (
              <div className="text-sm text-gray-600">
                <Phone className="w-3 h-3 inline mr-1" />
                {facility.contact_phone}
              </div>
            )}
            
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              <div>
                <span className="font-medium">{facility.total_pickups}</span> pickups
              </div>
              <div>
                <span className="font-medium">{facility.total_deliveries}</span> deliveries
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add to sidebar navigation */}
      {showForm && (
        <FacilityFormModal
          facility={editingFacility}
          onClose={() => { setShowForm(false); setEditingFacility(null); }}
          onSuccess={() => { fetchFacilities(); setShowForm(false); setEditingFacility(null); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
```

---

## ✅ Testing Checklist

After implementation, test these scenarios:

1. **Create Load with New Shipper/Receiver**
   - [ ] Enter new facility names
   - [ ] Add contact info
   - [ ] Add special instructions
   - [ ] Verify facility is auto-created in database

2. **Create Load with Existing Facility**
   - [ ] Select existing shipper from dropdown
   - [ ] Verify address auto-fills
   - [ ] Verify contact info auto-fills

3. **Edit Load**
   - [ ] Change shipper/receiver
   - [ ] Update contact info
   - [ ] Verify changes saved

4. **View Load Details**
   - [ ] Shipper/receiver info displayed
   - [ ] Contact phone clickable (tel: link)
   - [ ] Special instructions visible

5. **Facilities Management**
   - [ ] View all facilities
   - [ ] Search facilities
   - [ ] Edit facility details
   - [ ] See pickup/delivery counts

---

## 📊 Benefits

### For Dispatchers:
- ✅ **Faster Load Creation**: Select from saved facilities (no re-typing)
- ✅ **Contact Info at Fingertips**: One click to call shipper/receiver
- ✅ **Never Forget Instructions**: Gate codes, dock numbers saved

### For Drivers:
- ✅ **Know Who to Contact**: Name and phone number provided
- ✅ **Appointment Times**: Know when to arrive
- ✅ **Special Instructions**: Gate codes, procedures, etc.

### For Operations:
- ✅ **Performance Tracking**: Which facilities are slow?
- ✅ **Historical Data**: How many times have we been there?
- ✅ **Analytics**: Identify best/worst facilities

---

## 🚀 Next Steps

1. **Run SQL Migration** (`add-facilities-schema.sql`)
2. **Update LoadFormModal** (add shipper/receiver fields)
3. **Test Load Creation** (create loads with new facilities)
4. **Optional: Build Facilities Page** (manage facilities)
5. **Optional: Migrate Existing Loads** (run migration script in SQL file)

---

## 🎯 Future Enhancements

- **📸 Facility Photos**: Upload images of dock doors, gate entrances
- **⏱️ Loading Time Tracking**: Track actual load/unload times
- **⭐ Facility Ratings**: Rate facilities (1-5 stars)
- **📅 Dock Scheduling**: Book appointment slots
- **🗺️ Facility Map View**: Show facilities on map
- **📊 Facility Scorecards**: On-time %, avg wait time, etc.

---

**Questions?** Review the SQL file for database details or the code examples above for frontend implementation.

**Ready to ship!** 🚀
