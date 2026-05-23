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
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useDevices, type Device } from '../hooks/useDevices';
import { toast } from 'sonner';

export function DeviceManagement() {
  const {
    devices,
    loading,
    error,
    registerDevice,
    updateDevice,
    deleteDevice,
    rebootDevice,
    updateFirmware,
    updateDevicePing,
    refetch,
  } = useDevices();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_id: '',
    location: '',
    threshold_limit: '80',
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);

  const [isRebootDialogOpen, setIsRebootDialogOpen] = useState(false);
  const [deviceToReboot, setDeviceToReboot] = useState<Device | null>(null);

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [deviceToUpdate, setDeviceToUpdate] = useState<Device | null>(null);

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [deviceDetails, setDeviceDetails] = useState<Device | null>(null);

  const filteredDevices = devices.filter(
    (device) =>
      device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBatteryIcon = (level: number) => {
    if (level > 60) return <Battery className="w-4 h-4 text-[#2c5f6f]" />;
    if (level > 30) return <BatteryWarning className="w-4 h-4 text-amber-600" />;
    return <BatteryLow className="w-4 h-4 text-rose-600" />;
  };

  const formatLastPing = (lastPing: string | null) => {
    if (!lastPing) return 'Never';
    const minutes = Math.floor((Date.now() - new Date(lastPing).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleRegisterDevice = async () => {
    if (!newDevice.device_id || !newDevice.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const created = await registerDevice({
        device_id: newDevice.device_id,
        location: newDevice.location,
        threshold_limit: parseInt(newDevice.threshold_limit) || 80,
      });
      setIsDialogOpen(false);
      setNewDevice({ device_id: '', location: '', threshold_limit: '80' });
      toast.success('Device registered successfully!', {
        description: `${created.device_id} is now monitoring ${created.location}`,
      });
    } catch (err) {
      toast.error('Failed to register device', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleEditDevice = async () => {
    if (!editingDevice) return;
    try {
      await updateDevice(editingDevice.device_id, {
        location: editingDevice.location,
        threshold_limit: editingDevice.threshold_limit,
      });
      setIsEditDialogOpen(false);
      setEditingDevice(null);
      toast.success('Device updated successfully!', {
        description: `${editingDevice.device_id} configuration saved`,
      });
    } catch (err) {
      toast.error('Failed to update device', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    try {
      await deleteDevice(deviceToDelete.device_id);
      setIsDeleteDialogOpen(false);
      toast.success('Device deleted', {
        description: `${deviceToDelete.device_id} removed from system`,
      });
      setDeviceToDelete(null);
    } catch (err) {
      toast.error('Failed to delete device', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleRebootDevice = async () => {
    if (!deviceToReboot) return;
    const deviceId = deviceToReboot.device_id;
    setIsRebootDialogOpen(false);
    setDeviceToReboot(null);
    toast.info('Reboot initiated', {
      description: `${deviceId} is restarting...`,
    });
    try {
      await rebootDevice(deviceId);
      setTimeout(() => {
        toast.success('Device online', {
          description: `${deviceId} successfully rebooted`,
        });
      }, 3000);
    } catch (err) {
      toast.error('Reboot failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleUpdateFirmware = async () => {
    if (!deviceToUpdate) return;
    const deviceId = deviceToUpdate.device_id;
    setIsUpdateDialogOpen(false);
    setDeviceToUpdate(null);
    toast.info('Firmware update started', {
      description: `Updating ${deviceId}...`,
    });
    try {
      await updateFirmware(deviceId, 'v2.4.1');
      toast.success('Update complete', {
        description: `${deviceId} is now running firmware v2.4.1`,
      });
    } catch (err) {
      toast.error('Update failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleTestConnection = async (device: Device) => {
    toast.info('Testing connection...', {
      description: `Pinging ${device.device_id}`,
    });
    try {
      await updateDevicePing(device.device_id);
      toast.success('Connection successful', {
        description: `${device.device_id} responded in 45ms`,
      });
    } catch {
      toast.error('Connection failed', {
        description: `${device.device_id} is not responding`,
      });
    }
  };

  const onlineDevices = devices.filter((d) => d.network_status === 'online').length;
  const lowBatteryDevices = devices.filter((d) => (d.battery_level ?? 100) < 30).length;
  const avgBattery = devices.length > 0
    ? Math.round(devices.reduce((sum, d) => sum + (d.battery_level ?? 0), 0) / devices.length)
    : 0;

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <p className="text-lg font-semibold text-gray-900">Failed to load devices</p>
        <p className="text-sm text-gray-500">{error}</p>
        <Button onClick={refetch} className="bg-teal-600 hover:bg-teal-700 text-white">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

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
                  value={newDevice.device_id}
                  onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="Labtek IX - Floor 3"
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold Limit (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  max="100"
                  value={newDevice.threshold_limit}
                  onChange={(e) => setNewDevice({ ...newDevice, threshold_limit: e.target.value })}
                />
                <p className="text-xs text-gray-500">Alert triggers when bin reaches this capacity</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button className="bg-[#2c5f6f] hover:bg-teal-800 text-white" onClick={handleRegisterDevice}>
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
            <CardTitle className="text-sm font-medium text-gray-600">Devices Online</CardTitle>
            <Wifi className="w-5 h-5 text-[#2c5f6f]" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">
                {onlineDevices}/{devices.length}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {devices.length > 0
                ? `${((onlineDevices / devices.length) * 100).toFixed(0)}% uptime`
                : 'No devices registered'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Battery Devices</CardTitle>
            <BatteryLow className="w-5 h-5 text-rose-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{lowBatteryDevices}</div>
            )}
            <p className="text-xs text-gray-500 mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Battery</CardTitle>
            <Battery className="w-5 h-5 text-[#2c5f6f]" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{avgBattery}%</div>
            )}
            <p className="text-xs text-gray-500 mt-1">Across all devices</p>
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
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search devices..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
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
                  <TableHead>Firmware</TableHead>
                  <TableHead>Last Ping</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No devices match your search' : 'No devices registered'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device) => (
                    <TableRow key={device.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{device.device_id}</TableCell>
                      <TableCell>{device.location}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getBatteryIcon(device.battery_level ?? 0)}
                          <span className="text-sm">{device.battery_level ?? 'N/A'}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {device.network_status === 'online' ? (
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
                      <TableCell>{device.threshold_limit ?? 80}%</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {device.firmware_version ?? 'v2.3.1'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatLastPing(device.last_ping)}
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
                                setEditingDevice({ ...device });
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Device
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTestConnection(device)}>
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
            <DialogDescription>Update device configuration and settings</DialogDescription>
          </DialogHeader>
          {editingDevice && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-deviceId">Device ID</Label>
                <Input id="edit-deviceId" value={editingDevice.device_id} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-400">Device ID cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editingDevice.location}
                  onChange={(e) => setEditingDevice({ ...editingDevice, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-threshold">Threshold Limit (%)</Label>
                <Input
                  id="edit-threshold"
                  type="number"
                  min="0"
                  max="100"
                  value={editingDevice.threshold_limit ?? 80}
                  onChange={(e) =>
                    setEditingDevice({ ...editingDevice, threshold_limit: parseInt(e.target.value) || 80 })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#2c5f6f] hover:bg-teal-800 text-white" onClick={handleEditDevice}>
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
              This will permanently delete <strong>{deviceToDelete?.device_id}</strong> from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteDevice}>
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
              Are you sure you want to reboot <strong>{deviceToReboot?.device_id}</strong>?
              The device will be offline for approximately 3 seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[#2c5f6f] hover:bg-teal-800" onClick={handleRebootDevice}>
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
              This will update <strong>{deviceToUpdate?.device_id}</strong> to firmware version v2.4.1.
              The device will automatically reboot after the update completes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[#2c5f6f] hover:bg-teal-800" onClick={handleUpdateFirmware}>
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
              Complete information for {deviceDetails?.device_id}
            </DialogDescription>
          </DialogHeader>
          {deviceDetails && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Device ID</p>
                  <p className="text-sm font-semibold text-gray-900">{deviceDetails.device_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-sm font-semibold text-gray-900">{deviceDetails.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Battery Level</p>
                  <div className="flex items-center gap-2">
                    {getBatteryIcon(deviceDetails.battery_level ?? 0)}
                    <p className="text-sm font-semibold text-gray-900">{deviceDetails.battery_level ?? 'N/A'}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Network Status</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{deviceDetails.network_status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Threshold Limit</p>
                  <p className="text-sm font-semibold text-gray-900">{deviceDetails.threshold_limit ?? 80}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Ping</p>
                  <p className="text-sm font-semibold text-gray-900">{formatLastPing(deviceDetails.last_ping)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Firmware Version</p>
                  <p className="text-sm font-semibold text-gray-900">{deviceDetails.firmware_version ?? 'v2.3.1'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">IP Address</p>
                  <p className="text-sm font-semibold text-gray-900">{deviceDetails.ip_address ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Registered</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {deviceDetails.created_at
                      ? new Date(deviceDetails.created_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-500 mb-2">Device Health</p>
                <div className="flex items-center gap-2">
                  {deviceDetails.network_status === 'online' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-[#2c5f6f]" />
                      <span className="text-sm text-gray-900">All systems operational</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <span className="text-sm text-gray-900">Device is offline</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
