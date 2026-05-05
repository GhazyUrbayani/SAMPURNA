import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import {
  Plus,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  BatteryWarning,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { iotDevices, type IoTDevice } from '../data/mockData';
import { toast } from 'sonner';

export function DeviceManagement() {
  const [devices, setDevices] = useState<IoTDevice[]>(iotDevices);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    location: '',
    thresholdLimit: '80',
  });

  // Edit device modal
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<IoTDevice | null>(null);

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<IoTDevice | null>(null);

  // Reboot confirmation dialog
  const [isRebootDialogOpen, setIsRebootDialogOpen] = useState(false);
  const [deviceToReboot, setDeviceToReboot] = useState<IoTDevice | null>(null);

  // Update firmware dialog
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [deviceToUpdate, setDeviceToUpdate] = useState<IoTDevice | null>(null);

  // View details dialog
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [deviceDetails, setDeviceDetails] = useState<IoTDevice | null>(null);

  const filteredDevices = devices.filter(
    (device) =>
      device.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBatteryIcon = (level: number) => {
    if (level > 60) return <Battery className="w-4 h-4 text-[#2c5f6f]" />;
    if (level > 30) return <BatteryWarning className="w-4 h-4 text-amber-600" />;
    return <BatteryLow className="w-4 h-4 text-rose-600" />;
  };

  const handleRegisterDevice = () => {
    if (!newDevice.deviceId || !newDevice.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    const device: IoTDevice = {
      id: String(devices.length + 1),
      deviceId: newDevice.deviceId,
      location: newDevice.location,
      batteryLevel: 100,
      networkStatus: 'online',
      thresholdLimit: parseInt(newDevice.thresholdLimit),
      lastPing: new Date(),
    };

    setDevices([...devices, device]);
    setIsDialogOpen(false);
    setNewDevice({ deviceId: '', location: '', thresholdLimit: '80' });
    toast.success('Device registered successfully!', {
      description: `${device.deviceId} is now monitoring ${device.location}`,
    });
  };

  const handleEditDevice = () => {
    if (!editingDevice) return;

    setDevices(devices.map(d =>
      d.id === editingDevice.id ? editingDevice : d
    ));
    setIsEditDialogOpen(false);
    setEditingDevice(null);
    toast.success('Device updated successfully!', {
      description: `${editingDevice.deviceId} configuration saved`,
    });
  };

  const handleDeleteDevice = () => {
    if (!deviceToDelete) return;

    setDevices(devices.filter(d => d.id !== deviceToDelete.id));
    setIsDeleteDialogOpen(false);
    toast.success('Device deleted', {
      description: `${deviceToDelete.deviceId} removed from system`,
    });
    setDeviceToDelete(null);
  };

  const handleRebootDevice = () => {
    if (!deviceToReboot) return;

    toast.success('Reboot initiated', {
      description: `${deviceToReboot.deviceId} is restarting...`,
    });

    // Simulate reboot process
    setTimeout(() => {
      toast.success('Device online', {
        description: `${deviceToReboot.deviceId} successfully rebooted`,
      });
    }, 3000);

    setIsRebootDialogOpen(false);
    setDeviceToReboot(null);
  };

  const handleUpdateFirmware = () => {
    if (!deviceToUpdate) return;

    toast.success('Firmware update started', {
      description: `Updating ${deviceToUpdate.deviceId}...`,
    });

    // Simulate update process
    setTimeout(() => {
      toast.success('Update complete', {
        description: `${deviceToUpdate.deviceId} is now running latest firmware`,
      });
    }, 5000);

    setIsUpdateDialogOpen(false);
    setDeviceToUpdate(null);
  };

  const handleTestConnection = (device: IoTDevice) => {
    toast.info('Testing connection...', {
      description: `Pinging ${device.deviceId}`,
    });

    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      if (success) {
        toast.success('Connection successful', {
          description: `${device.deviceId} responded in 45ms`,
        });
      } else {
        toast.error('Connection failed', {
          description: `${device.deviceId} is not responding`,
        });
      }
    }, 2000);
  };

  const onlineDevices = devices.filter((d) => d.networkStatus === 'online').length;
  const lowBatteryDevices = devices.filter((d) => d.batteryLevel < 30).length;
  const avgBattery = Math.round(
    devices.reduce((sum, d) => sum + d.batteryLevel, 0) / devices.length
  );

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">Device Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure and monitor IoT sensor devices
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2c5f6f] hover:bg-teal-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Register New Device
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Register New IoT Device</DialogTitle>
              <DialogDescription>
                Add a new ESP32 sensor to the monitoring system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID *</Label>
                <Input
                  id="deviceId"
                  placeholder="ESP32-009"
                  value={newDevice.deviceId}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, deviceId: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="Labtek IX - Floor 3"
                  value={newDevice.location}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold Limit (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  max="100"
                  value={newDevice.thresholdLimit}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, thresholdLimit: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  Alert will trigger when bin reaches this capacity
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#2c5f6f] hover:bg-teal-800 text-white"
                onClick={handleRegisterDevice}
              >
                Register Device
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Devices Online
            </CardTitle>
            <Wifi className="w-5 h-5 text-[#2c5f6f]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {onlineDevices}/{devices.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((onlineDevices / devices.length) * 100).toFixed(0)}% uptime
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Low Battery Devices
            </CardTitle>
            <BatteryLow className="w-5 h-5 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{lowBatteryDevices}</div>
            <p className="text-xs text-gray-500 mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Battery
            </CardTitle>
            <Battery className="w-5 h-5 text-[#2c5f6f]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{avgBattery}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Across all devices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Device Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Registered Devices</CardTitle>
              <CardDescription>Manage all ESP32 sensor configurations</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search devices..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Network Status</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Last Ping</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No devices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device) => (
                    <TableRow key={device.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{device.deviceId}</TableCell>
                      <TableCell>{device.location}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getBatteryIcon(device.batteryLevel)}
                          <span className="text-sm">{device.batteryLevel}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {device.networkStatus === 'online' ? (
                          <Badge className="bg-teal-100 text-[#2c5f6f] hover:bg-teal-100">
                            <Wifi className="w-3 h-3 mr-1" />
                            Online
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                            <WifiOff className="w-3 h-3 mr-1" />
                            Offline
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{device.thresholdLimit}%</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {Math.floor((Date.now() - device.lastPing.getTime()) / 60000)} min ago
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeviceDetails(device);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingDevice(device);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Device
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTestConnection(device)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Test Connection
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeviceToReboot(device);
                                setIsRebootDialogOpen(true);
                              }}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reboot Device
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeviceToUpdate(device);
                                setIsUpdateDialogOpen(true);
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Update Firmware
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setDeviceToDelete(device);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Device
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device configuration and settings
            </DialogDescription>
          </DialogHeader>
          {editingDevice && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-deviceId">Device ID</Label>
                <Input
                  id="edit-deviceId"
                  value={editingDevice.deviceId}
                  onChange={(e) =>
                    setEditingDevice({ ...editingDevice, deviceId: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editingDevice.location}
                  onChange={(e) =>
                    setEditingDevice({ ...editingDevice, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-threshold">Threshold Limit (%)</Label>
                <Input
                  id="edit-threshold"
                  type="number"
                  min="0"
                  max="100"
                  value={editingDevice.thresholdLimit}
                  onChange={(e) =>
                    setEditingDevice({ ...editingDevice, thresholdLimit: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2c5f6f] hover:bg-teal-800 text-white"
              onClick={handleEditDevice}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deviceToDelete?.deviceId}</strong> from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteDevice}
            >
              Delete Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reboot Confirmation Dialog */}
      <AlertDialog open={isRebootDialogOpen} onOpenChange={setIsRebootDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reboot Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reboot <strong>{deviceToReboot?.deviceId}</strong>?
              The device will be offline for approximately 30 seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#2c5f6f] hover:bg-teal-800"
              onClick={handleRebootDevice}
            >
              Reboot Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Firmware Dialog */}
      <AlertDialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Firmware</AlertDialogTitle>
            <AlertDialogDescription>
              This will update <strong>{deviceToUpdate?.deviceId}</strong> to the latest firmware version (v2.4.1).
              The device will automatically reboot after the update completes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#2c5f6f] hover:bg-teal-800"
              onClick={handleUpdateFirmware}
            >
              Update Firmware
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
            <DialogDescription>
              Complete information for {deviceDetails?.deviceId}
            </DialogDescription>
          </DialogHeader>
          {deviceDetails && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Device ID</p>
                  <p className="text-sm font-semibold text-gray-900">{deviceDetails.deviceId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-sm font-semibold text-gray-900">{deviceDetails.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Battery Level</p>
                  <div className="flex items-center gap-2">
                    {getBatteryIcon(deviceDetails.batteryLevel)}
                    <p className="text-sm font-semibold text-gray-900">{deviceDetails.batteryLevel}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Network Status</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{deviceDetails.networkStatus}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Threshold Limit</p>
                  <p className="text-sm font-semibold text-gray-900">{deviceDetails.thresholdLimit}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Ping</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {Math.floor((Date.now() - deviceDetails.lastPing.getTime()) / 60000)} min ago
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Firmware Version</p>
                  <p className="text-sm font-semibold text-gray-900">v2.3.1</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">IP Address</p>
                  <p className="text-sm font-semibold text-gray-900">192.168.1.{parseInt(deviceDetails.id) + 100}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-500 mb-2">Device Health</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#2c5f6f]" />
                  <span className="text-sm text-gray-900">All systems operational</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
