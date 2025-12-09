import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { DataConnection, DataRecord, ConnectionType } from '../types';

// Mock Connections
const INITIAL_CONNECTIONS: DataConnection[] = [
  { 
    id: 'conn1', 
    name: '政务云管理平台API', 
    type: 'API', 
    host: 'https://cloud.gov.local/api/v2', 
    status: 'connected', 
    lastSync: '10分钟前', 
    description: '获取各单位云资源(CPU/内存/存储)使用情况',
    syncFrequency: 'HOURLY',
    config: { authType: 'BEARER', apiKey: 'sk-9283***' }
  },
  { 
    id: 'conn2', 
    name: '财政大数据中心库', 
    type: 'DATABASE', 
    host: '10.2.5.100:3306', 
    status: 'connected', 
    lastSync: '1小时前', 
    description: '获取年度预算与执行率数据',
    syncFrequency: 'DAILY',
    config: { username: 'readonly_user', dbName: 'finance_dw' }
  },
  { 
    id: 'conn3', 
    name: '发改委项目库接口', 
    type: 'API', 
    host: 'https://fgw.gov.local/projects', 
    status: 'error', 
    lastSync: '3天前', 
    description: '同步重大项目立项及进度信息',
    syncFrequency: 'WEEKLY',
    config: { authType: 'API_KEY' }
  },
];

// Mock Data Records (The "Archives")
const INITIAL_DATA_RECORDS: DataRecord[] = [
  // Batch 1: Cloud Resource Usage (Weekly) - This Week
  { id: 'r1', objectName: '市财政局', indicatorName: '云主机CPU平均使用率', value: 45.2, unit: '%', collectionTime: '2024-05-20 10:00:00', batchId: '2024-W21', sourceId: 'conn1', status: 'valid', metadata: '{"instance_id": "i-839201", "cpu_cores": 16, "usage_avg": 45.2, "peak": 67.5, "region": "zone-a"}' },
  { id: 'r2', objectName: '市交通局', indicatorName: '云主机CPU平均使用率', value: 78.5, unit: '%', collectionTime: '2024-05-20 10:00:05', batchId: '2024-W21', sourceId: 'conn1', status: 'valid', metadata: '{"instance_id": "i-992102", "cpu_cores": 32, "usage_avg": 78.5, "peak": 92.1, "region": "zone-b"}' },
  { id: 'r3', objectName: '市教育局', indicatorName: '云主机CPU平均使用率', value: 12.1, unit: '%', collectionTime: '2024-05-20 10:00:10', batchId: '2024-W21', sourceId: 'conn1', status: 'valid', metadata: '{"instance_id": "i-772101", "cpu_cores": 8, "usage_avg": 12.1, "peak": 25.0, "region": "zone-a"}' },
  
  // Batch 1: Storage (Weekly) - This Week
  { id: 'r4', objectName: '市财政局', indicatorName: '云存储使用量', value: 1.2, unit: 'TB', collectionTime: '2024-05-20 10:05:00', batchId: '2024-W21', sourceId: 'conn1', status: 'valid', metadata: '{"vol_id": "v-123", "total": 2.0, "used": 1.2, "type": "SSD"}' },
  
  // Batch 2: Budget Execution (Monthly)
  { id: 'r5', objectName: '市财政局', indicatorName: '年度预算执行率', value: 42.5, unit: '%', collectionTime: '2024-05-01 09:00:00', batchId: '2024-M05', sourceId: 'conn2', status: 'valid', metadata: '{"dept_code": "001", "total_budget": 5000000, "executed": 2125000, "fiscal_year": 2024}' },
  { id: 'r6', objectName: '市卫健委', indicatorName: '年度预算执行率', value: 38.2, unit: '%', collectionTime: '2024-05-01 09:00:00', batchId: '2024-M05', sourceId: 'conn2', status: 'valid', metadata: '{"dept_code": "005", "total_budget": 12000000, "executed": 4584000, "fiscal_year": 2024}' },

  // Batch 3: Previous Week
  { id: 'r7', objectName: '市财政局', indicatorName: '云主机CPU平均使用率', value: 44.8, unit: '%', collectionTime: '2024-05-13 10:00:00', batchId: '2024-W20', sourceId: 'conn1', status: 'valid', metadata: '{"instance_id": "i-839201", "cpu_cores": 16, "usage_avg": 44.8, "peak": 60.2}' },
];

interface DataChannelProps {
  activeTab: 'data-docking' | 'data-archives';
}

// --- Connection Modal Component ---
interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: DataConnection | null;
  onSave: (conn: DataConnection) => void;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, connection, onSave }) => {
  const [activeStep, setActiveStep] = useState<'basic' | 'params' | 'sync'>('basic');
  const [formData, setFormData] = useState<Partial<DataConnection>>({
    name: '',
    type: 'DATABASE',
    host: '',
    description: '',
    status: 'disconnected',
    lastSync: '-',
    syncFrequency: 'DAILY',
    config: {
      port: '3306',
      authType: 'NONE'
    }
  });

  // Test Connection State
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    if (isOpen) {
      if (connection) {
        setFormData(JSON.parse(JSON.stringify(connection)));
      } else {
        setFormData({
          name: '',
          type: 'DATABASE',
          host: '',
          description: '',
          status: 'disconnected',
          lastSync: '从未同步',
          syncFrequency: 'DAILY',
          config: { port: '3306', authType: 'NONE' }
        });
      }
      setActiveStep('basic');
      setTestStatus('idle');
    }
  }, [isOpen, connection]);

  if (!isOpen) return null;

  const handleTestConnection = () => {
    setTestStatus('testing');
    setTimeout(() => {
      // Simulate 80% success rate
      if (Math.random() > 0.2) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    }, 1500);
  };

  const handleSave = () => {
    const newConn = {
      ...formData,
      id: formData.id || `conn-${Date.now()}`,
      status: testStatus === 'success' ? 'connected' : formData.status
    } as DataConnection;
    onSave(newConn);
  };

  const renderBasic = () => (
    <div className="space-y-4 animate-fade-in">
       <div className="space-y-1">
          <label className="block text-sm font-bold text-gray-700">连接名称 <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
            placeholder="例如：政务云API接口"
          />
       </div>
       
       <div className="space-y-1">
          <label className="block text-sm font-bold text-gray-700">数据源类型 <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-3 gap-3">
             {(['DATABASE', 'API', 'FILE_SERVER'] as ConnectionType[]).map(t => (
               <div 
                 key={t}
                 onClick={() => setFormData({...formData, type: t})}
                 className={`border rounded p-3 cursor-pointer transition-all flex flex-col items-center gap-2
                   ${formData.type === t ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-600'}
                 `}
               >
                  {t === 'DATABASE' && <Icons.Database size={20}/>}
                  {t === 'API' && <Icons.Globe size={20}/>}
                  {t === 'FILE_SERVER' && <Icons.Server size={20}/>}
                  <span className="text-xs font-medium">{t}</span>
               </div>
             ))}
          </div>
       </div>

       <div className="space-y-1">
          <label className="block text-sm font-bold text-gray-700">主机地址 / 接口根路径 <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={formData.host}
            onChange={e => setFormData({...formData, host: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none font-mono"
            placeholder={formData.type === 'API' ? 'https://api.example.com/v1' : '192.168.1.100'}
          />
       </div>

       <div className="space-y-1">
          <label className="block text-sm font-bold text-gray-700">描述说明</label>
          <textarea 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none h-20 resize-none"
            placeholder="请描述该数据源的用途及包含的数据内容..."
          />
       </div>
    </div>
  );

  const renderParams = () => {
    const config = formData.config || {};
    const updateConfig = (key: string, val: any) => setFormData({ ...formData, config: { ...config, [key]: val } });

    return (
      <div className="space-y-4 animate-fade-in">
         {formData.type === 'DATABASE' && (
           <>
              <div className="flex gap-4">
                 <div className="flex-1 space-y-1">
                    <label className="block text-sm font-bold text-gray-700">端口 (Port)</label>
                    <input 
                      type="text" 
                      value={config.port} 
                      onChange={e => updateConfig('port', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                    />
                 </div>
                 <div className="flex-1 space-y-1">
                    <label className="block text-sm font-bold text-gray-700">数据库名</label>
                    <input 
                      type="text" 
                      value={config.dbName} 
                      onChange={e => updateConfig('dbName', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                    />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="block text-sm font-bold text-gray-700">用户名</label>
                 <input 
                   type="text" 
                   value={config.username} 
                   onChange={e => updateConfig('username', e.target.value)}
                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                 />
              </div>
              <div className="space-y-1">
                 <label className="block text-sm font-bold text-gray-700">密码</label>
                 <input 
                   type="password" 
                   value={config.password} 
                   onChange={e => updateConfig('password', e.target.value)}
                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                   placeholder="••••••••"
                 />
              </div>
           </>
         )}

         {formData.type === 'API' && (
            <>
               <div className="space-y-1">
                  <label className="block text-sm font-bold text-gray-700">认证方式</label>
                  <select 
                    value={config.authType}
                    onChange={e => updateConfig('authType', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none bg-white"
                  >
                     <option value="NONE">No Auth</option>
                     <option value="BASIC">Basic Auth</option>
                     <option value="BEARER">Bearer Token</option>
                     <option value="API_KEY">API Key</option>
                  </select>
               </div>
               
               {config.authType === 'API_KEY' && (
                 <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">API Key</label>
                    <input 
                      type="text" 
                      value={config.apiKey} 
                      onChange={e => updateConfig('apiKey', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none font-mono"
                    />
                 </div>
               )}
               
               {(config.authType === 'BEARER') && (
                 <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">Token</label>
                    <textarea 
                      value={config.password} 
                      onChange={e => updateConfig('password', e.target.value)} // Reusing password field for token
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none font-mono h-24"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                 </div>
               )}
            </>
         )}
         
         {formData.type === 'FILE_SERVER' && (
           <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded border border-dashed border-gray-200">
             支持 FTP/SFTP/S3 协议配置 <br/> (UI暂未展开)
           </div>
         )}
      </div>
    );
  };

  const renderSync = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">同步频率</label>
          <div className="grid grid-cols-2 gap-3">
             {[
               {id: 'REALTIME', label: '实时同步 (Realtime)', desc: '数据变更即时推送'},
               {id: 'HOURLY', label: '每小时 (Hourly)', desc: '整点触发同步任务'},
               {id: 'DAILY', label: '每天 (Daily)', desc: '每日凌晨自动同步'},
               {id: 'WEEKLY', label: '每周 (Weekly)', desc: '每周日进行全量同步'},
               {id: 'MANUAL', label: '手动触发', desc: '仅在人工点击时同步'},
             ].map(opt => (
               <div 
                 key={opt.id}
                 onClick={() => setFormData({...formData, syncFrequency: opt.id as any})}
                 className={`border rounded p-3 cursor-pointer transition-all
                   ${formData.syncFrequency === opt.id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300'}
                 `}
               >
                  <div className={`text-sm font-bold ${formData.syncFrequency === opt.id ? 'text-blue-700' : 'text-gray-700'}`}>{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
               </div>
             ))}
          </div>
       </div>

       <div className="bg-orange-50 border border-orange-100 rounded p-4 flex gap-3">
          <Icons.AlertCircle className="text-orange-500 flex-shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-bold text-orange-800">注意事项</h4>
            <p className="text-xs text-orange-700 mt-1 leading-relaxed">
               高频率的同步可能会增加源系统的负载。建议在业务低峰期（如凌晨）进行大批量数据同步。实时同步需源系统支持Webhook回调机制。
            </p>
          </div>
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
       <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
             <div>
                <h3 className="text-lg font-bold text-gray-800">{connection ? '配置数据连接' : '新建数据连接'}</h3>
                <p className="text-xs text-gray-500 mt-1">{connection ? connection.name : '配置外部数据源接入参数'}</p>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded transition-colors">
                <Icons.Plus size={24} className="rotate-45" />
             </button>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
             {/* Sidebar Tabs */}
             <div className="w-48 bg-gray-50 border-r border-gray-200 py-6 space-y-1">
                <button 
                  onClick={() => setActiveStep('basic')}
                  className={`w-full text-left px-6 py-3 text-sm flex items-center gap-3 transition-colors border-l-4
                    ${activeStep === 'basic' ? 'bg-white text-blue-600 font-bold border-blue-600' : 'text-gray-600 hover:bg-gray-100 border-transparent'}
                  `}
                >
                  <Icons.FileText size={16}/> 基础信息
                </button>
                <button 
                  onClick={() => setActiveStep('params')}
                  className={`w-full text-left px-6 py-3 text-sm flex items-center gap-3 transition-colors border-l-4
                    ${activeStep === 'params' ? 'bg-white text-blue-600 font-bold border-blue-600' : 'text-gray-600 hover:bg-gray-100 border-transparent'}
                  `}
                >
                  <Icons.Settings size={16}/> 对接参数
                </button>
                <button 
                  onClick={() => setActiveStep('sync')}
                  className={`w-full text-left px-6 py-3 text-sm flex items-center gap-3 transition-colors border-l-4
                    ${activeStep === 'sync' ? 'bg-white text-blue-600 font-bold border-blue-600' : 'text-gray-600 hover:bg-gray-100 border-transparent'}
                  `}
                >
                  <Icons.RefreshCw size={16}/> 同步频率
                </button>
             </div>
             
             {/* Content Area */}
             <div className="flex-1 p-8 overflow-y-auto">
                {activeStep === 'basic' && renderBasic()}
                {activeStep === 'params' && renderParams()}
                {activeStep === 'sync' && renderSync()}
             </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
             <div className="flex items-center gap-2">
                <button 
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className={`
                    px-4 py-2 border rounded text-sm flex items-center gap-2 transition-colors
                    ${testStatus === 'testing' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'}
                  `}
                >
                   {testStatus === 'testing' ? (
                     <><Icons.RefreshCw size={14} className="animate-spin"/> 测试中...</>
                   ) : (
                     <><Icons.Activity size={14}/> 测试连接</>
                   )}
                </button>
                {testStatus === 'success' && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Icons.CheckCircle size={12}/> 连接成功</span>}
                {testStatus === 'error' && <span className="text-xs text-red-600 font-medium flex items-center gap-1"><Icons.AlertCircle size={12}/> 连接失败</span>}
             </div>
             
             <div className="flex gap-3">
               <button onClick={onClose} className="px-5 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors">取消</button>
               <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2">
                 <Icons.Save size={16} /> 保存配置
               </button>
             </div>
          </div>
       </div>
    </div>
  );
};


export const DataChannel: React.FC<DataChannelProps> = ({ activeTab }) => {
  const [connections, setConnections] = useState(INITIAL_CONNECTIONS);
  const [records, setRecords] = useState(INITIAL_DATA_RECORDS);
  
  // Filter States
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Metadata Drawer State
  const [showMetadata, setShowMetadata] = useState(false);
  const [activeRecord, setActiveRecord] = useState<DataRecord | null>(null);

  // Connection Modal State
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DataConnection | null>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.connection-card-dropdown')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenCreate = () => {
    setEditingConnection(null);
    setShowConnectionModal(true);
  };

  const handleOpenEdit = (conn: DataConnection) => {
    setEditingConnection(conn);
    setShowConnectionModal(true);
  };

  const handleDeleteConnection = (id: string) => {
    if (window.confirm('确定要删除该连接配置吗？此操作不可恢复。')) {
      setConnections(prev => prev.filter(c => c.id !== id));
      setActiveDropdownId(null);
    }
  };

  const handleSaveConnection = (newConn: DataConnection) => {
    if (editingConnection) {
      setConnections(connections.map(c => c.id === newConn.id ? newConn : c));
    } else {
      setConnections([...connections, newConn]);
    }
    setShowConnectionModal(false);
  };

  // --- Render Functions ---

  const renderDocking = () => (
    <div className="p-6 h-full flex flex-col bg-gray-50/30 overflow-y-auto">
       <div className="flex justify-between items-center mb-6">
         <div>
            <h2 className="text-xl font-bold text-gray-800">数据对接管理</h2>
            <p className="text-gray-500 text-sm mt-1">配置与外部系统的数据源连接，支持数据库、API及文件服务。</p>
         </div>
         <button 
           onClick={handleOpenCreate}
           className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
         >
           <Icons.Plus size={18} /> 新建连接
         </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map(conn => (
            <div key={conn.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group relative">
               
               {/* Dropdown Section */}
               <div className="absolute top-4 right-4 connection-card-dropdown">
                  <div 
                    className="text-gray-300 hover:text-gray-600 cursor-pointer p-1 rounded hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                       e.stopPropagation();
                       setActiveDropdownId(activeDropdownId === conn.id ? null : conn.id);
                    }}
                  >
                    <Icons.MoreHorizontal size={20} />
                  </div>
                  
                  {activeDropdownId === conn.id && (
                     <div className="absolute top-8 right-0 w-32 bg-white border border-gray-200 shadow-lg rounded-md py-1 z-20 animate-fade-in">
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             handleOpenEdit(conn);
                             setActiveDropdownId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Icons.Edit size={14} /> 编辑配置
                        </button>
                        <button 
                           onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConnection(conn.id);
                           }}
                           className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                        >
                          <Icons.Trash2 size={14} /> 删除连接
                        </button>
                     </div>
                  )}
               </div>
               
               <div className="flex items-center gap-4 mb-4 pr-8">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-sm
                    ${conn.type === 'DATABASE' ? 'bg-indigo-500' : conn.type === 'API' ? 'bg-emerald-500' : 'bg-orange-500'}
                  `}>
                    {conn.type === 'DATABASE' && <Icons.Database size={24} />}
                    {conn.type === 'API' && <Icons.Globe size={24} />}
                    {conn.type === 'FILE_SERVER' && <Icons.Server size={24} />}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{conn.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${conn.status === 'connected' ? 'bg-green-500' : conn.status === 'error' ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                      <span className={`text-xs ${conn.status === 'connected' ? 'text-green-600' : conn.status === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
                        {conn.status === 'connected' ? '运行正常' : conn.status === 'error' ? '连接异常' : '未连接'}
                      </span>
                    </div>
                  </div>
               </div>

               <div className="space-y-2 mb-4">
                 <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Icons.Link2 size={12} className="flex-shrink-0" /> 
                    <span className="truncate max-w-[200px]" title={conn.host}>{conn.host}</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Icons.Activity size={12} className="flex-shrink-0" /> 
                    <span>上次同步: {conn.lastSync}</span>
                 </div>
                 {/* Show Frequency Tag */}
                 <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Icons.Clock size={12} className="flex-shrink-0" />
                    <span>频率: {conn.syncFrequency || 'Default'}</span>
                 </div>
               </div>

               <div className="pt-4 border-t border-gray-100 flex gap-2">
                 <button 
                   onClick={() => handleOpenEdit(conn)}
                   className="flex-1 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                 >
                   配置
                 </button>
                 <button className="flex-1 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                   {conn.status === 'connected' ? <Icons.Wifi size={12}/> : <Icons.WifiOff size={12}/>} 测试连接
                 </button>
               </div>
            </div>
          ))}
          
          <div 
            onClick={handleOpenCreate}
            className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer min-h-[220px] transition-colors bg-white"
          >
             <Icons.Plus size={32} className="mb-2" />
             <span className="text-sm font-medium">添加新数据源</span>
          </div>
       </div>
    </div>
  );

  const renderArchives = () => {
    // Filter Logic
    const filteredRecords = records.filter(record => {
      const matchSource = selectedSourceId ? record.sourceId === selectedSourceId : true;
      const matchSearch = searchTerm ? (
        record.objectName.includes(searchTerm) || 
        record.indicatorName.includes(searchTerm) ||
        record.batchId.includes(searchTerm)
      ) : true;
      const matchDate = dateFilter ? record.collectionTime.startsWith(dateFilter) : true;
      return matchSource && matchSearch && matchDate;
    });

    const handleViewMetadata = (record: DataRecord) => {
      setActiveRecord(record);
      setShowMetadata(true);
    };

    const selectedSource = connections.find(c => c.id === selectedSourceId);

    return (
      <div className="flex h-full bg-gray-50/30">
         {/* Left Sidebar: Data Sources */}
         <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <span className="font-bold text-gray-700 text-sm">数据来源列表</span>
               <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{connections.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
               <div 
                 onClick={() => setSelectedSourceId('')}
                 className={`
                   px-3 py-2.5 rounded-md text-sm cursor-pointer flex items-center gap-2 transition-colors
                   ${!selectedSourceId ? 'bg-blue-50 text-blue-600 font-medium ring-1 ring-blue-100' : 'text-gray-600 hover:bg-gray-50'}
                 `}
               >
                  <Icons.Layers size={16} className={!selectedSourceId ? 'text-blue-500' : 'text-gray-400'} /> 
                  <span className="flex-1">全部数据档案</span>
               </div>
               
               <div className="my-2 border-t border-gray-100 mx-2"></div>
               
               {connections.map(conn => (
                 <div 
                   key={conn.id}
                   onClick={() => setSelectedSourceId(conn.id)}
                   className={`
                     px-3 py-2.5 rounded-md text-sm cursor-pointer flex items-center gap-2 group transition-all relative
                     ${selectedSourceId === conn.id ? 'bg-white shadow-sm ring-1 ring-gray-200 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}
                   `}
                 >
                    {/* Active Indicator */}
                    {selectedSourceId === conn.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r"></div>
                    )}

                    {conn.type === 'DATABASE' ? <Icons.Database size={16} className={selectedSourceId === conn.id ? 'text-indigo-500' : 'text-gray-400'}/> : 
                     conn.type === 'API' ? <Icons.Globe size={16} className={selectedSourceId === conn.id ? 'text-emerald-500' : 'text-gray-400'}/> : 
                     <Icons.FileText size={16} className="text-gray-400"/>}
                    
                    <span className="truncate flex-1">{conn.name}</span>
                    
                    {conn.status === 'connected' && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
                    {conn.status === 'error' && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                 </div>
               ))}
            </div>
         </div>

         {/* Right Content: Data Table */}
         <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header & Filters */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                     {selectedSource ? selectedSource.name : '全部数据档案'}
                     {selectedSource && (
                       <span className={`text-[10px] px-2 py-0.5 rounded border ${selectedSource.type === 'API' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                         {selectedSource.type}
                       </span>
                     )}
                   </h2>
                   <p className="text-sm text-gray-500 mt-1">
                     {selectedSource 
                        ? `数据源地址: ${selectedSource.host} (最后同步: ${selectedSource.lastSync})` 
                        : '所有已接入数据源的归集记录总览'}
                   </p>
                 </div>
                 <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:text-blue-600 hover:border-blue-600 bg-white transition-colors shadow-sm">
                       <Icons.Download size={14}/> 导出CSV
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm">
                       <Icons.RefreshCw size={14}/> 立即同步
                    </button>
                 </div>
               </div>

               <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 px-2">
                     <Icons.Filter size={14} className="text-gray-500"/>
                     <span className="text-sm font-medium text-gray-700">筛选:</span>
                  </div>
                  <div className="h-4 w-[1px] bg-gray-300"></div>
                  
                  <div className="relative flex-1 max-w-sm">
                     <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                     <input 
                       type="text" 
                       placeholder="搜索评价对象、指标名称、批次号..." 
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                     />
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1.5">
                     <span className="text-xs text-gray-500">采集日期:</span>
                     <input 
                        type="date" 
                        className="text-sm outline-none text-gray-700" 
                        value={dateFilter} 
                        onChange={e => setDateFilter(e.target.value)} 
                     />
                  </div>
               </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
               <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider backdrop-blur-sm sticky top-0 z-10">
                        <tr>
                           <th className="px-6 py-3 w-16 text-center">状态</th>
                           <th className="px-6 py-3">评价对象</th>
                           <th className="px-6 py-3">指标名称</th>
                           <th className="px-6 py-3">数值</th>
                           <th className="px-6 py-3">采集时间 / 批次</th>
                           {!selectedSourceId && <th className="px-6 py-3">来源接口</th>}
                           <th className="px-6 py-3 text-right">操作</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredRecords.length > 0 ? (
                          filteredRecords.map((record, index) => {
                            const source = connections.find(c => c.id === record.sourceId);
                            return (
                              <tr key={record.id} className="hover:bg-blue-50/40 transition-colors group">
                                 <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center" title="数据有效">
                                       <Icons.CheckCircle size={16} className="text-green-500" />
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 font-medium text-gray-800">{record.objectName}</td>
                                 <td className="px-6 py-4 text-gray-700">{record.indicatorName}</td>
                                 <td className="px-6 py-4">
                                   <div className="flex items-baseline gap-1">
                                      <span className="font-mono font-bold text-blue-600 text-base">{record.value}</span>
                                      <span className="text-gray-400 text-xs">{record.unit}</span>
                                   </div>
                                 </td>
                                 <td className="px-6 py-4">
                                   <div className="flex flex-col">
                                      <span className="text-gray-700 font-mono text-xs">{record.collectionTime}</span>
                                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-1">
                                        Batch: {record.batchId}
                                      </span>
                                   </div>
                                 </td>
                                 {!selectedSourceId && (
                                   <td className="px-6 py-4 text-gray-500 text-xs">
                                     <div className="flex items-center gap-1.5" title={source?.name}>
                                       {source?.type === 'API' ? <Icons.Globe size={12}/> : <Icons.Database size={12}/>}
                                       <span className="truncate max-w-[100px]">{source?.name}</span>
                                     </div>
                                   </td>
                                 )}
                                 <td className="px-6 py-4 text-right">
                                   <button 
                                     onClick={() => handleViewMetadata(record)}
                                     className="text-blue-600 hover:text-blue-800 flex items-center gap-1 justify-end text-xs font-medium bg-blue-50 px-2.5 py-1.5 rounded hover:bg-blue-100 transition-colors ml-auto shadow-sm border border-blue-100"
                                   >
                                      <Icons.Eye size={14} /> 查看元数据
                                   </button>
                                 </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={selectedSourceId ? 6 : 7} className="px-6 py-16 text-center text-gray-400 flex flex-col items-center justify-center">
                               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                  <Icons.Search size={24} className="text-gray-300"/>
                               </div>
                               <span>当前条件下无数据记录</span>
                            </td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
         
         {/* Metadata Drawer */}
         {showMetadata && activeRecord && (
           <div className="fixed inset-0 bg-black/20 z-50 flex justify-end backdrop-blur-[1px]">
              <div className="w-[600px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                 <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                       <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                          <Icons.FileJson size={20} className="text-blue-600"/> 数据档案详情
                       </h3>
                       <p className="text-xs text-gray-500 mt-1">Record ID: {activeRecord.id}</p>
                    </div>
                    <button onClick={() => setShowMetadata(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded transition-colors">
                       <Icons.Plus size={24} className="rotate-45" />
                    </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {/* Key Info Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                       <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <span className="text-xs text-blue-500 uppercase font-bold tracking-wider">Metric Value</span>
                          <div className="mt-1 flex items-baseline gap-1">
                             <span className="text-2xl font-bold text-blue-700">{activeRecord.value}</span>
                             <span className="text-sm text-blue-600">{activeRecord.unit}</span>
                          </div>
                          <div className="text-xs text-blue-400 mt-1 truncate">{activeRecord.indicatorName}</div>
                       </div>
                       <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Object</span>
                          <div className="mt-1 text-lg font-bold text-gray-800">{activeRecord.objectName}</div>
                          <div className="text-xs text-gray-400 mt-1">Batch: {activeRecord.batchId}</div>
                       </div>
                    </div>

                    <div className="mb-6 border-t border-gray-100 pt-4">
                       <h4 className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-blue-600 pl-2">基础属性</h4>
                       <div className="space-y-3 text-sm">
                          <div className="flex justify-between border-b border-gray-50 pb-2">
                             <span className="text-gray-500">数据来源</span>
                             <span className="text-gray-800">{connections.find(c => c.id === activeRecord.sourceId)?.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-50 pb-2">
                             <span className="text-gray-500">采集时间</span>
                             <span className="text-gray-800 font-mono">{activeRecord.collectionTime}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-50 pb-2">
                             <span className="text-gray-500">入库状态</span>
                             <span className="text-green-600 flex items-center gap-1"><Icons.CheckCircle size={12}/> 已校验入库</span>
                          </div>
                       </div>
                    </div>

                    <div>
                       <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 border-l-4 border-purple-500 pl-2">
                          元数据报文 (Raw Metadata)
                       </h4>
                       <div className="bg-[#1e1e1e] rounded-lg p-4 overflow-x-auto shadow-inner relative group">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-2 py-1">Copy</button>
                          </div>
                          <pre className="text-xs font-mono text-blue-300 leading-relaxed whitespace-pre-wrap break-all">
                             {JSON.stringify(JSON.parse(activeRecord.metadata), null, 2)}
                          </pre>
                       </div>
                       <div className="flex gap-2 mt-2">
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded">Format: JSON</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded">Size: {activeRecord.metadata.length} bytes</span>
                       </div>
                    </div>
                 </div>

                 <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-colors">标记异常</button>
                    <button 
                      onClick={() => setShowMetadata(false)} 
                      className="px-6 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100 text-gray-700 transition-colors shadow-sm"
                    >
                      关闭
                    </button>
                 </div>
              </div>
           </div>
         )}
      </div>
    );
  };

  return (
    <div className="h-full relative">
      {activeTab === 'data-docking' ? renderDocking() : renderArchives()}
      <ConnectionModal 
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        connection={editingConnection}
        onSave={handleSaveConnection}
      />
    </div>
  );
};