import React, { useState } from 'react';
import { Icons } from './components/Icons';
import { IndicatorLibrary } from './components/IndicatorLibrary';
import { ModelManagement } from './components/ModelManagement';
import { DataChannel } from './components/DataChannel';

// Types
interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Icons;
  badge?: string;
  children?: MenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: '领导桌面', icon: 'Home' }, 
  { id: 'req', label: '需求列表 (审批)', icon: 'FileText' }, 
  { id: 'experts', label: '专家库', icon: 'Users' }, 
  { id: 'ai', label: '智能辅助', icon: 'Bot', badge: 'New' }, 
  { 
    id: 'perf', 
    label: '绩效评价', 
    icon: 'Bookmark', // Screenshot icon looks like a ribbon/bookmark
    children: [
      { id: 'perf-lib', label: '指标库管理', icon: 'Database' }, // Screenshot shows this active
      { id: 'perf-model', label: '模型管理', icon: 'Layers' }, 
      { id: 'perf-tasks', label: '评价任务管理', icon: 'FileText' }, 
      { id: 'perf-results', label: '项目结果查看', icon: 'Search' }, 
    ]
  },
  { 
    id: 'data-channel', 
    label: '数据通道', 
    icon: 'Link2', 
    children: [
      { id: 'data-docking', label: '数据对接', icon: 'Server' },
      { id: 'data-archives', label: '数据档案', icon: 'FileText' },
    ]
  },
  { id: 'resources', label: '资料中心', icon: 'Database' },
  { id: 'projects', label: '项目库', icon: 'LayoutGrid' }, // Screenshot shows grid icon
  { id: 'system', label: '系统中心', icon: 'Layers' }, // Screenshot shows layers/stack
  { id: 'map', label: '一张图', icon: 'Map' },
];

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('data-archives'); // Default to new feature for demo
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['perf', 'data-channel']);

  const toggleExpand = (id: string) => {
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const SidebarItem: React.FC<{ item: MenuItem; level?: number }> = ({ item, level = 0 }) => {
    const Icon = Icons[item.icon] as React.ElementType;
    const isActive = activeMenu === item.id;
    const isExpanded = expandedMenus.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isChild = level > 0;

    return (
      <>
        <div 
          onClick={() => {
            if (hasChildren) toggleExpand(item.id);
            else setActiveMenu(item.id);
          }}
          className={`
            flex items-center px-4 py-3 cursor-pointer transition-colors relative
            ${isActive && !hasChildren ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#002140] hover:text-white'}
          `}
          style={{ paddingLeft: `${20 + level * 16}px` }}
        >
          {/* Main icons for top level, bullets for children usually, but screenshot shows icons for children too */}
          {(!isChild || hasChildren) && <Icon size={18} className={`${isActive ? 'text-white' : 'text-gray-400'} mr-3`} />}
          
          {/* For submenu items in the screenshot, they have bullets or simpler icons. Let's stick to simple bullet if no icon provided, but we have icons. */}
          {isChild && !hasChildren && <span className={`w-1.5 h-1.5 rounded-full mr-3 ${isActive ? 'bg-white' : 'bg-gray-500'}`}></span>}

          <span className={`flex-1 text-sm ${isActive ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
          
          {item.badge && (
            <span className="bg-[#1890ff] text-white text-[10px] px-1.5 py-0.5 rounded-sm mr-2 leading-none">
              {item.badge}
            </span>
          )}
          
          {hasChildren && (
            <span className="text-gray-500">
              {isExpanded ? <Icons.ChevronDown size={14} /> : <Icons.ChevronRight size={14} />}
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="bg-[#000c17] shadow-inner">
            {item.children!.map(child => (
              <SidebarItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden font-sans text-slate-800">
      {/* Sidebar */}
      <div className="w-[220px] bg-[#001529] flex flex-col shadow-xl z-20 flex-shrink-0 transition-all duration-300">
        <div className="h-14 flex items-center px-5 bg-[#002140] shadow-sm">
          <Icons.Layers className="text-white mr-2" size={24} />
          <span className="text-white text-lg font-bold tracking-wide">云平台</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {MENU_ITEMS.map(item => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white shadow-sm flex items-center justify-between px-6 z-10 border-b border-gray-200">
           <div className="flex items-center gap-2 text-sm">
             <span className="text-gray-500">首页</span>
             <span className="text-gray-300">/</span>
             <span className="font-medium text-gray-800">
               {activeMenu.startsWith('data-') ? '数据通道' : '绩效评价'}
             </span>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="relative cursor-pointer">
               <Icons.Bell size={18} className="text-gray-600" />
               <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </div>
             <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-gray-100 bg-gray-100"
                />
                <span className="text-sm text-gray-700">张小六</span>
             </div>
           </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-hidden relative p-0">
          {activeMenu === 'perf-lib' ? (
            <IndicatorLibrary />
          ) : activeMenu === 'perf-model' ? (
            <ModelManagement />
          ) : activeMenu === 'data-docking' || activeMenu === 'data-archives' ? (
            <DataChannel activeTab={activeMenu as 'data-docking' | 'data-archives'} />
          ) : (
            <div className="flex items-center justify-center h-full bg-[#f0f2f5] flex-col gap-4">
               <div className="bg-white p-12 rounded-lg shadow-sm text-center">
                 <Icons.Settings size={48} className="mx-auto text-gray-300 mb-4 animate-spin-slow" />
                 <h3 className="text-lg font-medium text-gray-700">功能模块建设中</h3>
                 <p className="text-gray-500 mt-2">Current Module: {activeMenu}</p>
                 <button 
                  onClick={() => setActiveMenu('perf-lib')}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                 >
                   返回指标库
                 </button>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;