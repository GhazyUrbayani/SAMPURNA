import { useState } from 'react';
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
  CheckCircle
} from 'lucide-react';
import { trashBins, type TrashBin } from '../data/mockData';
import { toast } from 'sonner';

export function Dashboard() {
  const [bins, setBins] = useState<TrashBin[]>(trashBins);

  const criticalBins = bins.filter(bin => bin.status === 'critical').length;
  const activeDevices = bins.length;
  const recentAlerts = bins.filter(bin => bin.status === 'critical' || bin.status === 'warning').length;

  const getStatusColor = (fullness: number) => {
    if (fullness > 80) return 'bg-rose-600';
    if (fullness >= 50) return 'bg-amber-500';
    return 'bg-teal-600';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'critical') {
      return <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50">Critical</Badge>;
    }
    if (status === 'warning') {
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Warning</Badge>;
    }
    return <Badge className="bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50">Normal</Badge>;
  };

  const handleMarkAsEmptied = (binId: string) => {
    setBins(prev =>
      prev.map(bin =>
        bin.id === binId
          ? { 
              ...bin, 
              fullness: 0, 
              status: 'normal', 
              lastUpdated: new Date() 
            }
          : bin
      )
    );
    toast.success('Bin marked as emptied successfully!', {
      description: 'The bin status has been updated.',
    });
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

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
            <div className="text-3xl font-bold text-gray-900">{bins.length}</div>
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
            <div className="text-3xl font-bold text-gray-900">{criticalBins}</div>
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
            <div className="text-3xl font-bold text-gray-900">{activeDevices}</div>
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
            <div className="text-3xl font-bold text-gray-900">{recentAlerts}</div>
            <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Monitoring Grid */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Live Bin Monitoring</h3>
          <p className="text-sm text-gray-500">Real-time capacity tracking across all locations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bins.map((bin) => (
            <Card 
              key={bin.id} 
              className="hover:shadow-lg transition-all cursor-pointer group border-2"
              style={{
                borderColor: bin.status === 'critical' ? '#ef4444' : 
                            bin.status === 'warning' ? '#eab308' : 
                            '#e5e7eb'
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      {bin.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {bin.location}
                    </div>
                  </div>
                  {getStatusBadge(bin.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Circular Progress Indicator */}
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke={
                          bin.fullness > 80 ? '#e11d48' :
                          bin.fullness >= 50 ? '#d97706' :
                          '#0d9488'
                        }
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - bin.fullness / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">
                        {bin.fullness}%
                      </span>
                      <span className="text-xs text-gray-500">Full</span>
                    </div>
                  </div>
                </div>

                {/* Linear Progress Bar */}
                <div className="space-y-2">
                  <Progress 
                    value={bin.fullness} 
                    className="h-2"
                    indicatorClassName={getStatusColor(bin.fullness)}
                  />
                </div>

                {/* Device Info */}
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      Device
                    </span>
                    <span className="font-medium text-gray-700">{bin.deviceId}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated
                    </span>
                    <span className="font-medium text-gray-700">
                      {formatTimeAgo(bin.lastUpdated)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleMarkAsEmptied(bin.id)}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Emptied
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}