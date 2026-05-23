import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Bell,
  CheckCircle,
  Sparkles,
  Database,
  TrendingDown,
  Minus,
  Loader2,
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { buildForecast, seedHistoricalData, ForecastResult } from '../lib/forecast';
import { toast } from 'sonner';

const TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

export function Analytics() {
  const { trends, zoneData, statusDistribution, alerts, summary, loading, refetch } = useAnalytics();
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadForecast = useCallback(async () => {
    try {
      setForecastLoading(true);
      const result = await buildForecast(30, 7);
      setForecast(result);
    } catch (err: unknown) {
      console.error('Forecast error:', err);
      toast.error('Failed to build forecast', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setForecastLoading(false);
    }
  }, []);

  useEffect(() => { loadForecast(); }, [loadForecast]);

  const handleSeed = async () => {
    if (!confirm('Generate 30 days of synthetic capacity history and push to Supabase? This may insert thousands of rows.')) return;
    try {
      setSeeding(true);
      toast.info('Seeding historical data...', { description: 'Generating synthetic readings' });
      const result = await seedHistoricalData(30, 4);
      toast.success('Historical data seeded!', {
        description: `Inserted ${result.inserted} readings across ${result.bins} bins.`,
      });
      await Promise.all([refetch(), loadForecast()]);
    } catch (err: unknown) {
      console.error('Seed error:', err);
      toast.error('Seed failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSeeding(false);
    }
  };

  const formatAlertTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getAlertBadge = (type: string | null) => {
    if (type === 'critical') return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Critical</Badge>;
    if (type === 'warning') return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Warning</Badge>;
    return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Offline</Badge>;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">Analytics & Historical Data</h3>
          <p className="text-sm text-gray-500 mt-1">
            Track trends, AI forecasts, and waste collection patterns
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
            {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
            {seeding ? 'Seeding...' : 'Seed Historical Data'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { refetch(); loadForecast(); }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Capacity Now
            </CardTitle>
            <Activity className="w-5 h-5 text-[#2c5f6f]" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{summary.avgCapacity}%</div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Across {summary.totalBins} monitored bins
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Alerts
            </CardTitle>
            <Bell className="w-5 h-5 text-rose-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{summary.activeAlertCount}</div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Unresolved alerts in system
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Highest Load Zone
            </CardTitle>
            <MapPin className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-gray-900 truncate">{summary.mostActiveZone}</div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {summary.mostActiveZoneAvg}% avg capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="forecast">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            AI Forecast
          </TabsTrigger>
          <TabsTrigger value="trends">Capacity Trends</TabsTrigger>
          <TabsTrigger value="zones">Zone Comparison</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#2c5f6f]" />
                    AI Capacity Forecast — Next 7 Days
                  </CardTitle>
                  <CardDescription>
                    Linear regression model trained on the last 30 days of capacity readings
                  </CardDescription>
                </div>
                {forecast && forecast.series.length > 0 && (
                  <div className="flex items-center gap-2">
                    {forecast.trend === 'rising' && (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                        <TrendingUp className="w-3 h-3 mr-1" /> Rising
                      </Badge>
                    )}
                    {forecast.trend === 'falling' && (
                      <Badge className="bg-teal-50 text-teal-700 border-teal-200">
                        <TrendingDown className="w-3 h-3 mr-1" /> Falling
                      </Badge>
                    )}
                    {forecast.trend === 'stable' && (
                      <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                        <Minus className="w-3 h-3 mr-1" /> Stable
                      </Badge>
                    )}
                    <Badge variant="outline">R² {(forecast.r2 * 100).toFixed(0)}%</Badge>
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                      {forecast.model}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {forecastLoading ? (
                <div className="h-[400px] bg-gray-100 rounded animate-pulse" />
              ) : !forecast || forecast.series.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Sparkles className="w-12 h-12" />
                  <p className="text-lg font-medium">Not enough historical data</p>
                  <p className="text-sm">Click <span className="font-medium">Seed Historical Data</span> above to generate synthetic readings.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-[#0d9488]" /> Actual</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-3 border-t-2 border-dashed border-[#9333ea]" /> Forecast</span>
                  </div>
                  <ResponsiveContainer width="100%" height={380}>
                    <LineChart
                      data={forecast.series}
                      key={`forecast-${forecast.series.length}-${forecast.series[0]?.date ?? ''}`}
                    >
                      <CartesianGrid key="fc-grid" strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis key="fc-xaxis" dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <YAxis
                        key="fc-yaxis"
                        stroke="#6b7280"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        domain={[0, 100]}
                        label={{ value: 'Capacity (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                      />
                      <Tooltip key="fc-tooltip" contentStyle={TOOLTIP_STYLE} />
                      <Line
                        key="fc-line-actual"
                        type="monotone"
                        dataKey="actual"
                        stroke="#0d9488"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5 }}
                        name="Actual"
                        isAnimationActive={false}
                      />
                      <Line
                        key="fc-line-forecast"
                        type="monotone"
                        dataKey="forecast"
                        stroke="#9333ea"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={false}
                        activeDot={{ r: 5 }}
                        name="Forecast"
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500">Daily change</div>
                      <div className="font-semibold text-gray-900">
                        {forecast.slope > 0 ? '+' : ''}{forecast.slope.toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500">Model confidence</div>
                      <div className="font-semibold text-gray-900">{(forecast.r2 * 100).toFixed(0)}%</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500">Time to 100%</div>
                      <div className="font-semibold text-gray-900">
                        {forecast.hoursToFull == null ? '—' :
                          forecast.hoursToFull < 24 ? `${forecast.hoursToFull}h` : `${Math.round(forecast.hoursToFull / 24)}d`}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500">Forecast horizon</div>
                      <div className="font-semibold text-gray-900">7 days</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Chart */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Trends — Last 7 Days</CardTitle>
              <CardDescription>
                Average bin fill level recorded per day across all monitored bins
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] bg-gray-100 rounded animate-pulse" />
              ) : trends.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 gap-3">
                  <TrendingUp className="w-12 h-12" />
                  <p className="text-lg font-medium">No historical data yet</p>
                  <p className="text-sm">Capacity readings will appear here as bins are monitored.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      domain={[0, 100]}
                      label={{ value: 'Avg Capacity (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Avg Capacity']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avg_capacity"
                      stroke="#0d9488"
                      strokeWidth={3}
                      dot={{ fill: '#0d9488', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Avg Capacity (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zone Comparison Chart */}
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Capacity by Zone</CardTitle>
              <CardDescription>
                Current average fill level per location zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] bg-gray-100 rounded animate-pulse" />
              ) : zoneData.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 gap-3">
                  <MapPin className="w-12 h-12" />
                  <p className="text-lg font-medium">No zone data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={zoneData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="zone"
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      domain={[0, 100]}
                      label={{ value: 'Avg Capacity (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v) => [`${v}%`, 'Avg Capacity']}
                    />
                    <Legend />
                    <Bar
                      dataKey="avg_capacity"
                      fill="#0d9488"
                      radius={[8, 8, 0, 0]}
                      name="Avg Capacity (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Distribution Chart */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Bin Status Distribution</CardTitle>
              <CardDescription>
                Real-time breakdown of bin statuses across all zones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] bg-gray-100 rounded animate-pulse" />
              ) : statusDistribution.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Activity className="w-12 h-12" />
                  <p className="text-lg font-medium">No status data available</p>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, name) => [`${v} bins`, name]} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-4 min-w-[160px]">
                    {statusDistribution.map((item) => (
                      <div key={item.name} className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <div>
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.value} bin{item.value !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Active Alerts & Efficiency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-rose-600" />
              Active Alerts
            </CardTitle>
            <CardDescription>Unresolved alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-400">
                <CheckCircle className="w-10 h-10 text-teal-500" />
                <p className="text-sm font-medium text-gray-700">All clear!</p>
                <p className="text-xs">No active alerts at this time.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      alert.alert_type === 'critical'
                        ? 'bg-rose-50 border-rose-200'
                        : alert.alert_type === 'warning'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      alert.alert_type === 'critical' ? 'text-rose-600' :
                      alert.alert_type === 'warning' ? 'text-amber-600' :
                      'text-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">{alert.bin_id}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatAlertTime(alert.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{alert.message}</p>
                    </div>
                    {getAlertBadge(alert.alert_type)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle>System Efficiency Metrics</CardTitle>
            <CardDescription>Real-time performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Bins at Normal Level</span>
                {loading ? (
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <span className="text-sm font-bold text-gray-900">
                    {statusDistribution.find(s => s.name === 'Normal')?.value ?? 0}/
                    {summary.totalBins}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-700"
                  style={{
                    width: summary.totalBins > 0
                      ? `${((statusDistribution.find(s => s.name === 'Normal')?.value ?? 0) / summary.totalBins) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Bins Requiring Attention</span>
                {loading ? (
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <span className="text-sm font-bold text-gray-900">
                    {(statusDistribution.find(s => s.name === 'Warning')?.value ?? 0) +
                     (statusDistribution.find(s => s.name === 'Critical')?.value ?? 0)}/
                    {summary.totalBins}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-700"
                  style={{
                    width: summary.totalBins > 0
                      ? `${(((statusDistribution.find(s => s.name === 'Warning')?.value ?? 0) +
                            (statusDistribution.find(s => s.name === 'Critical')?.value ?? 0)) /
                           summary.totalBins) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Average Fill Level</span>
                {loading ? (
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <span className="text-sm font-bold text-gray-900">{summary.avgCapacity}%</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${
                    summary.avgCapacity > 80 ? 'bg-rose-600' :
                    summary.avgCapacity >= 50 ? 'bg-amber-500' :
                    'bg-teal-600'
                  }`}
                  style={{ width: `${summary.avgCapacity}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Critical Alerts</span>
                {loading ? (
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <span className="text-sm font-bold text-gray-900">
                    {summary.criticalCount} bins
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-rose-600 h-2 rounded-full transition-all duration-700"
                  style={{
                    width: summary.totalBins > 0
                      ? `${(summary.criticalCount / summary.totalBins) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
