import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
  Trash2,
  AlertTriangle,
  Cpu,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useBins } from '../hooks/useBins';
import { toast } from 'sonner';

export function Dashboard() {
  const { bins, loading, error, markAsEmptied, refetch } = useBins();

  const criticalBins = bins.filter(bin => bin.status === 'critical').length;
  const onlineDevices = bins.filter(bin => bin.status !== 'offline').length;
  const recentAlerts = bins.filter(
    bin => bin.status === 'critical' || bin.status === 'warning'
  ).length;

  const getStatusColor = (capacity: number) => {
    if (capacity > 80) return 'bg-rose-600';
    if (capacity >= 50) return 'bg-amber-500';
    return 'bg-teal-600';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'critical') {
      return <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50">Critical</Badge>;
    }
    if (status === 'warning') {
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Warning</Badge>;
    }
    if (status === 'offline') {
      return <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">Offline</Badge>;
    }
    return <Badge className="bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50">Normal</Badge>;
  };

  const handleMarkAsEmptied = async (binId: string, displayId: string) => {
    try {
      await markAsEmptied(binId);
      toast.success('Bin marked as emptied!', {
        description: `${displayId} status updated to Normal.`,
      });
    } catch (err) {
      toast.error('Failed to update bin', {
        description: 'Please try again.',
      });
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <p className="text-lg font-semibold text-gray-900">Failed to load dashboard data</p>
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
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-teal-600 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Bins Monitored
            </CardTitle>
            <Trash2 className="w-5 h-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{bins.length}</div>
            )}
            <p className="text-xs text-gray-500 mt-1">Active monitoring points</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-600 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Bins Critical
            </CardTitle>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{criticalBins}</div>
            )}
            <p className="text-xs text-gray-500 mt-1">Requires immediate pickup</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-600 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active IoT Devices
            </CardTitle>
            <Cpu className="w-5 h-5 text-slate-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{onlineDevices}</div>
            )}
            <p className="text-xs text-gray-500 mt-1">ESP32 sensors online</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Recent Alerts
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{recentAlerts}</div>
            )}
            <p className="text-xs text-gray-500 mt-1">Warning or critical bins</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Monitoring Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Live Bin Monitoring</h3>
            <p className="text-sm text-gray-500">Real-time capacity tracking across all locations</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gray-200" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded" />
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <Trash2 className="w-12 h-12" />
            <p className="text-lg font-medium">No bins found</p>
            <p className="text-sm">Add bins to the database to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bins.map((bin) => {
              const capacity = bin.capacity_percentage ?? 0;
              return (
                <Card
                  key={bin.id}
                  className="hover:shadow-lg transition-all cursor-pointer group border-2"
                  style={{
                    borderColor:
                      bin.status === 'critical' ? '#ef4444' :
                      bin.status === 'warning' ? '#eab308' :
                      '#e5e7eb',
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold text-gray-900 truncate">
                          {bin.bin_id}
                        </CardTitle>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{bin.location}</span>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">{getStatusBadge(bin.status)}</div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Circular Progress Indicator */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke={
                              capacity > 80 ? '#e11d48' :
                              capacity >= 50 ? '#d97706' :
                              '#0d9488'
                            }
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - capacity / 100)}`}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-gray-900">{capacity}%</span>
                          <span className="text-xs text-gray-500">Full</span>
                        </div>
                      </div>
                    </div>

                    {/* Linear Progress Bar */}
                    <Progress
                      value={capacity}
                      className="h-2"
                      indicatorClassName={getStatusColor(capacity)}
                    />

                    {/* Device Info */}
                    <div className="space-y-1 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          Device
                        </span>
                        <span className="font-medium text-gray-700">{bin.device_id ?? 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Updated
                        </span>
                        <span className="font-medium text-gray-700">
                          {formatTimeAgo(bin.last_updated)}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleMarkAsEmptied(bin.bin_id, bin.bin_id)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                      size="sm"
                      disabled={bin.status === 'normal' && capacity === 0}
                    >
                      {bin.status === 'normal' && capacity === 0 ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Already Empty
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Emptied
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
