import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { Indicator, DataSource, CategoryNode } from '../types';

// Replicated Data from Screenshot
export const INITIAL_CATEGORIES: CategoryNode[] = [
  {
    id: 'root',
    name: '全部指标分类',
    isOpen: true,
    children: [
      { id: 'c1', name: '系统应用情况' },
      { 
        id: 'c2', 
        name: '系统数据情况',
        children: [
          { id: 'c2-1', name: '接入一体化大数据平台能力' },
          { id: 'c2-2', name: '云池接入情况' },
          { id: 'c2-3', name: '数据库审计情况' }
        ]
      },
      { 
        id: 'c3', 
        name: '政务云使用情况',
        isOpen: true, 
        children: [
          { id: 'c3-1', name: 'CPU使用情况' },
          { id: 'c3-2', name: '内存使用情况' },
          { id: 'c3-3', name: '数据存储使用情况' }
        ]
      },
      { id: 'c4', name: '安全风险评估' },
      { id: 'c5', name: '其他' }
    ]
  },
];

export const INITIAL_INDICATORS: Indicator[] = [
  { id: '1', name: '业务子模块访问情况', description: '评估业务子模块访问情况', type: 'Quantitative' as any, source: DataSource.AUTO, status: true, category: 'c1', unit: '次/日', sampleValue: 1500 },
  { id: '2', name: '业务子模块数据情况', description: '评估业务子模块数据情况', type: 'Quantitative' as any, source: DataSource.AUTO, status: true, category: 'c1', unit: 'GB', sampleValue: 45.2 },
  { id: '3', name: '数据重复率', description: '数据重复率', type: 'Quantitative' as any, source: DataSource.AUTO, status: true, category: 'c2', unit: '%', sampleValue: 12.5 },
  { id: '4', name: '数据空缺率', description: '数据空缺率', type: 'Quantitative' as any, source: DataSource.AUTO, status: true, category: 'c2', unit: '%', sampleValue: 3.8 },
  { id: '5', name: '数据挂载率', description: '数据挂载率', type: 'Quantitative' as any, source: DataSource.AUTO, status: true, category: 'c2', unit: '%', sampleValue: 98.2 },
  { id: '6', name: '汇聚时效性', description: '汇聚时效性', type: 'Quantitative' as any, source: DataSource.AUTO, status: true, category: 'c2', unit: '小时', sampleValue: 2 },
  { id: '7', name: '审核时效性', description: '审核时效性', type: 'Quantitative' as any, source: DataSource.AUTO, status: true, category: 'c2', unit: '工作日', sampleValue: 1.5 },
  { id: '8', name: '数据准确性', description: '数据准确性', type: 'Quantitative' as any, source: DataSource.AUTO, status: true, category: 'c2', unit: '%', sampleValue: 99.9 },
  { id: '9', name: '项目文档合规性', description: '专家人工抽查项目文档是否齐全', type: 'Qualitative' as any, source: DataSource.MANUAL, status: true, category: 'c4', unit: '分', sampleValue: 90 },
  { id: '10', name: '用户满意度评分', description: '业务部门对系统使用的满意度打分', type: 'Qualitative' as any, source: DataSource.MANUAL, status: true, category: 'c5', unit: '分', sampleValue: 95 },
];

// --- Modal Component ---

interface IndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (indicator: Indicator) => void;
  categories: CategoryNode[];
}

const IndicatorModal: React.FC<IndicatorModalProps> = ({ isOpen, onClose, onSave, categories }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'logic'>('basic');
  const [calculationMode, setCalculationMode] = useState<'visual' | 'code'>('visual');
  const [variableTab, setVariableTab] = useState<'basic' | 'library'>('basic');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<Partial<Indicator>>({
    name: '',
    category: '',
    source: DataSource.AUTO,
    description: '',
    status: true,
    calculationType: 'visual',
    calculationScript: ''
  });

  if (!isOpen) return null;

  // Flatten categories for dropdown with indentation
  const getFlattenedCategories = (nodes: CategoryNode[], level = 0): {id: string, name: string, level: number}[] => {
    let result: {id: string, name: string, level: number}[] = [];
    nodes.forEach(node => {
      result.push({ id: node.id, name: node.name, level });
      if (node.children) {
        result = [...result, ...getFlattenedCategories(node.children, level + 1)];
      }
    });
    return result;
  };
  const flatCategories = getFlattenedCategories(categories);

  const insertText = (text: string) => {
    if (textAreaRef.current) {
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const currentVal = formData.calculationScript || '';
      const newVal = currentVal.substring(0, start) + text + currentVal.substring(end);
      
      setFormData({ ...formData, calculationScript: newVal });
      
      // Defer setting selection range to ensure React render cycle completes
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          textAreaRef.current.setSelectionRange(start + text.length, start + text.length);
        }
      }, 10);
    } else {
      setFormData({ ...formData, calculationScript: (formData.calculationScript || '') + text });
    }
  };

  const basicVariables = [
    {name: 'API调用次数', code: 'API_CALLS', type: 'Integer'},
    {name: '数据存储量(MB)', code: 'STORAGE_MB', type: 'Float'},
    {name: 'CPU平均负载', code: 'CPU_LOAD', type: 'Percentage'},
    {name: '系统在线时长', code: 'UPTIME_SEC', type: 'Integer'},
  ];

  const libraryVariables = [
    {name: '业务子模块数据情况', code: 'IND_002', type: 'Ref'},
    {name: '数据重复率', code: 'IND_003', type: 'Ref'},
    {name: '数据空缺率', code: 'IND_004', type: 'Ref'},
    {name: '数据挂载率', code: 'IND_005', type: 'Ref'},
  ];

  const operators = ['+', '-', '*', '/', '(', ')', '>', '<', '==', '&&', '||'];
  const functions = ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN', 'IF', 'SCORE', 'DELTA'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-[900px] h-[650px] flex flex-col animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Icons.Bot size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">新建指标</h3>
              <p className="text-xs text-gray-400">配置指标定义、数据来源及计算逻辑</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Icons.Plus size={24} className="transform rotate-45" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-gray-50 border-r border-gray-200 py-4 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('basic')}
              className={`text-sm px-6 py-3 text-left flex items-center gap-2 border-l-[3px] transition-colors
                ${activeTab === 'basic' ? 'border-blue-600 bg-white text-blue-600 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-100'}
              `}
            >
              <Icons.Settings size={16} /> 基础信息
            </button>
            <button
              onClick={() => setActiveTab('logic')}
              className={`text-sm px-6 py-3 text-left flex items-center gap-2 border-l-[3px] transition-colors
                ${activeTab === 'logic' ? 'border-blue-600 bg-white text-blue-600 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-100'}
              `}
            >
              <Icons.BarChart2 size={16} /> 计算逻辑
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {activeTab === 'basic' ? (
              <div className="space-y-6 max-w-2xl">
                {/* Basic Info Form */}
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-gray-700">指标名称 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="请输入指标名称"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-bold text-gray-700">所属分类 <span className="text-red-500">*</span></label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="">请选择分类</option>
                    {flatCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {'\u00A0\u00A0'.repeat(cat.level)}{cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">数据来源</label>
                  
                  {/* System Auto Card */}
                  <div 
                    onClick={() => setFormData({ ...formData, source: DataSource.AUTO })}
                    className={`
                      border rounded-lg p-4 flex gap-3 cursor-pointer transition-all
                      ${formData.source === DataSource.AUTO ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'}
                    `}
                  >
                    <div className="pt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.source === DataSource.AUTO ? 'border-blue-600' : 'border-gray-400'}`}>
                        {formData.source === DataSource.AUTO && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-bold text-gray-700 text-sm">
                        <Icons.Database size={16} className="text-blue-500" /> 系统采集
                      </div>
                      <p className="text-xs text-gray-500 mt-1">通过预定义的计算公式，从业务系统数据库或日志中自动抓取数据计算得出，无需人工干预。</p>
                    </div>
                  </div>

                  {/* Manual Entry Card */}
                  <div 
                    onClick={() => setFormData({ ...formData, source: DataSource.MANUAL })}
                    className={`
                      border rounded-lg p-4 flex gap-3 cursor-pointer transition-all
                      ${formData.source === DataSource.MANUAL ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'}
                    `}
                  >
                    <div className="pt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.source === DataSource.MANUAL ? 'border-blue-600' : 'border-gray-400'}`}>
                        {formData.source === DataSource.MANUAL && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-bold text-gray-700 text-sm">
                        <Icons.Edit size={16} className="text-gray-500" /> 人工录入
                      </div>
                      <p className="text-xs text-gray-500 mt-1">适用于定性评价或无法自动获取的数据。需手动打分或录入具体数值。</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-bold text-gray-700">指标描述说明</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-24 resize-none"
                    placeholder="请输入指标描述"
                  />
                </div>

                <div className="flex items-center gap-2">
                   <input 
                    type="checkbox" 
                    id="enableStatus"
                    checked={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                   />
                   <label htmlFor="enableStatus" className="text-sm text-gray-700 cursor-pointer select-none">启用该指标</label>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Logic Tab Content */}
                {formData.source === DataSource.MANUAL ? (
                   <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Icons.Slash size={32} />
                      </div>
                      <div className="text-center">
                        <h4 className="text-gray-600 font-medium">无需配置计算逻辑</h4>
                        <p className="text-sm mt-1">当前数据来源为“人工录入”，数值将由人工直接填写。</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('basic')}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        修改数据来源
                      </button>
                   </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex bg-gray-100 p-1 rounded-lg">
                          <button 
                            onClick={() => setCalculationMode('visual')}
                            className={`px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-1
                              ${calculationMode === 'visual' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                             <Icons.LayoutGrid size={14}/> 可视化公式 (Visual)
                          </button>
                          <button 
                            onClick={() => setCalculationMode('code')}
                            className={`px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-1
                              ${calculationMode === 'code' ? 'bg-white shadow-sm text-purple-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                             <Icons.Code size={14}/> 高级代码 (Code)
                          </button>
                       </div>
                       <div className="text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded text-blue-700 border border-blue-100">
                         {calculationMode === 'visual' ? '通过数学运算和函数组合构建计算逻辑。' : '使用脚本语言编写复杂业务逻辑，支持条件判断。'}
                       </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                       <div className="relative flex-1 rounded-lg overflow-hidden border border-gray-300 flex flex-col shadow-sm">
                          <textarea 
                             ref={textAreaRef}
                             className={`flex-1 w-full font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed transition-colors
                               ${calculationMode === 'code' ? 'bg-[#0d1117] text-gray-300' : 'bg-white text-gray-800'}
                             `}
                             value={formData.calculationScript}
                             onChange={(e) => setFormData({...formData, calculationScript: e.target.value})}
                             placeholder={calculationMode === 'visual' ? 'SCORE(ModuleVisits)' : '// Enter your script...'}
                             spellCheck={false}
                          />
                          <div className={`px-4 py-2 flex justify-end gap-2 border-t ${calculationMode === 'code' ? 'bg-[#161b22] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                             <button 
                               onClick={() => setFormData({...formData, calculationScript: ''})}
                               className={`text-xs px-3 py-1 rounded border transition-colors
                                 ${calculationMode === 'code' ? 'text-gray-400 hover:text-white border-gray-600 hover:border-gray-500' : 'text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400 bg-white'}
                               `}
                             >
                               清空
                             </button>
                             <button className="text-xs text-[#2da44e] hover:text-[#4ac26b] px-3 py-1 rounded border border-[#2da44e]/30 hover:border-[#2da44e] flex items-center gap-1 bg-[#2da44e]/10 transition-colors">
                               <Icons.CheckCircle size={12} /> 校验语法
                             </button>
                          </div>
                       </div>

                       {/* Helpers Panel */}
                       <div className="h-48 border border-gray-200 rounded-lg flex flex-col bg-white shadow-sm">
                          <div className="flex border-b border-gray-100">
                             <button 
                                onClick={() => setVariableTab('basic')}
                                className={`px-4 py-2 text-sm border-b-2 font-medium transition-colors ${variableTab === 'basic' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                             >
                               基础变量
                             </button>
                             <button 
                                onClick={() => setVariableTab('library')}
                                className={`px-4 py-2 text-sm border-b-2 font-medium transition-colors ${variableTab === 'library' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                             >
                               指标库变量
                             </button>
                          </div>
                          <div className="flex-1 flex overflow-hidden">
                             {/* Variables List */}
                             <div className="w-1/2 border-r border-gray-100 p-0 overflow-y-auto custom-scrollbar">
                                {(variableTab === 'basic' ? basicVariables : libraryVariables).map((v, i) => (
                                  <div 
                                    key={i} 
                                    onClick={() => insertText(v.code)}
                                    className="flex justify-between items-center p-2.5 hover:bg-blue-50 cursor-pointer group border-b border-gray-50 transition-colors"
                                  >
                                     <div>
                                        <div className="text-sm text-gray-700 font-medium group-hover:text-blue-700">{v.name}</div>
                                        <div className="text-xs text-gray-400 font-mono group-hover:text-blue-400">{v.code}</div>
                                     </div>
                                     <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 group-hover:bg-blue-100 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                                        {v.type}
                                     </span>
                                  </div>
                                ))}
                             </div>
                             
                             {/* Operators & Functions */}
                             <div className="w-1/2 p-4 bg-gray-50/50 overflow-y-auto custom-scrollbar">
                                <div className="text-xs font-bold text-gray-500 mb-2 flex justify-between">
                                  <span>运算符</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                   {operators.map(op => (
                                     <button 
                                       key={op} 
                                       onClick={() => insertText(` ${op} `)}
                                       className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-md font-mono shadow-sm transition-all active:scale-95"
                                     >
                                       {op}
                                     </button>
                                   ))}
                                </div>
                                
                                <div className="text-xs font-bold text-gray-500 mb-2">
                                  通用函数
                                </div>
                                <div className="flex flex-wrap gap-2">
                                   {functions.map(fn => (
                                     <button 
                                       key={fn} 
                                       onClick={() => insertText(`${fn}()`)}
                                       className="px-3 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-md font-medium shadow-sm transition-all active:scale-95"
                                     >
                                       {fn}
                                     </button>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-white hover:border-gray-400 transition-colors bg-white shadow-sm"
          >
            取消
          </button>
          <button 
            onClick={() => {
              if (formData.name && formData.category) {
                onSave({
                  ...formData as Indicator,
                  id: Date.now().toString(),
                  type: 'Quantitative' as any
                });
              } else {
                alert('请填写必要信息');
              }
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 shadow-md flex items-center gap-2 transition-colors"
          >
            <Icons.Save size={16} /> 保存指标
          </button>
        </div>
      </div>
    </div>
  );
};

export const IndicatorLibrary: React.FC = () => {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [indicators, setIndicators] = useState(INITIAL_INDICATORS);
  const [selectedCategory, setSelectedCategory] = useState<string>('root');
  
  // Modal State for Categories
  const [categoryModalConfig, setCategoryModalConfig] = useState<{
    isOpen: boolean;
    type: 'add_root' | 'add_sub' | 'edit';
    targetId: string | null;
    inputValue: string;
  }>({ isOpen: false, type: 'add_root', targetId: null, inputValue: '' });

  // Modal State for Indicators
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);

  // --- Tree Logic Helpers ---
  const toggleCategory = (id: string, nodes: CategoryNode[]): CategoryNode[] => {
    return nodes.map(node => {
      if (node.id === id) return { ...node, isOpen: !node.isOpen };
      if (node.children) return { ...node, children: toggleCategory(id, node.children) };
      return node;
    });
  };

  const addNode = (nodes: CategoryNode[], parentId: string, newNode: CategoryNode): CategoryNode[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        return { ...node, children: [...(node.children || []), newNode], isOpen: true };
      }
      if (node.children) {
        return { ...node, children: addNode(node.children, parentId, newNode) };
      }
      return node;
    });
  };

  const updateNode = (nodes: CategoryNode[], id: string, newName: string): CategoryNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, name: newName };
      }
      if (node.children) {
        return { ...node, children: updateNode(node.children, id, newName) };
      }
      return node;
    });
  };

  const deleteNode = (nodes: CategoryNode[], id: string): CategoryNode[] => {
    return nodes
      .filter(node => node.id !== id)
      .map(node => {
        if (node.children) {
          return { ...node, children: deleteNode(node.children, id) };
        }
        return node;
      });
  };

  // --- Handlers ---

  const handleToggleCategory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategories(toggleCategory(id, categories));
  };

  const handleOpenAddRoot = () => {
    setCategoryModalConfig({ isOpen: true, type: 'add_root', targetId: null, inputValue: '' });
  };

  const handleOpenAddSub = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCategoryModalConfig({ isOpen: true, type: 'add_sub', targetId: id, inputValue: '' });
  };

  const handleOpenEdit = (e: React.MouseEvent, node: CategoryNode) => {
    e.stopPropagation();
    setCategoryModalConfig({ isOpen: true, type: 'edit', targetId: node.id, inputValue: node.name });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除该分类吗?')) {
      setCategories(deleteNode(categories, id));
      if (selectedCategory === id) setSelectedCategory('root');
    }
  };

  const handleCategoryModalSave = () => {
    const { type, targetId, inputValue } = categoryModalConfig;
    if (!inputValue.trim()) return;

    if (type === 'add_root') {
      const newNode: CategoryNode = { id: `cat-${Date.now()}`, name: inputValue };
      setCategories([...categories, newNode]);
    } else if (type === 'add_sub' && targetId) {
      const newNode: CategoryNode = { id: `cat-${Date.now()}`, name: inputValue };
      setCategories(addNode(categories, targetId, newNode));
    } else if (type === 'edit' && targetId) {
      setCategories(updateNode(categories, targetId, inputValue));
    }

    setCategoryModalConfig({ ...categoryModalConfig, isOpen: false });
  };

  const handleSaveIndicator = (newIndicator: Indicator) => {
    setIndicators([...indicators, newIndicator]);
    setShowIndicatorModal(false);
  };

  const renderTree = (nodes: CategoryNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div 
          className={`
            group flex items-center px-2 py-2 cursor-pointer text-sm transition-colors relative pr-2
            ${selectedCategory === node.id ? 'bg-[#e6f7ff] text-[#1890ff] border-r-2 border-[#1890ff]' : 'text-gray-600 hover:bg-gray-100'}
          `}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => setSelectedCategory(node.id)}
        >
          {node.children && node.children.length > 0 ? (
            <span 
              onClick={(e) => handleToggleCategory(node.id, e)}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded cursor-pointer"
            >
              {node.isOpen ? <Icons.ChevronDown size={14} /> : <Icons.ChevronRight size={14} />}
            </span>
          ) : (
            <span className="w-5" />
          )}
          
          {node.children ? 
            <Icons.FolderOpen size={16} className={`mr-2 flex-shrink-0 ${selectedCategory === node.id ? 'text-[#1890ff]' : 'text-[#1890ff]'}`} /> : 
            <Icons.Folder size={16} className={`mr-2 flex-shrink-0 ${selectedCategory === node.id ? 'text-[#1890ff]' : 'text-gray-400'}`} />
          }
          <span className="truncate flex-1">{node.name}</span>

          {/* Hover Actions */}
          <div className="hidden group-hover:flex items-center gap-1 bg-gray-100/80 px-1 rounded absolute right-2">
            <button 
              onClick={(e) => handleOpenAddSub(e, node.id)} 
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-white rounded shadow-sm"
              title="添加子分类"
            >
              <Icons.Plus size={12} />
            </button>
            <button 
              onClick={(e) => handleOpenEdit(e, node)} 
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-white rounded shadow-sm"
              title="编辑分类"
            >
              <Icons.Edit size={12} />
            </button>
            <button 
              onClick={(e) => handleDelete(e, node.id)} 
              className="p-1 text-gray-500 hover:text-red-600 hover:bg-white rounded shadow-sm"
              title="删除分类"
            >
              <Icons.Trash2 size={12} />
            </button>
          </div>
        </div>
        {node.isOpen && node.children && (
          <div>{renderTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-full gap-4 p-4 relative">
      {/* Left Panel: Category Tree */}
      <div className="w-[280px] bg-white rounded shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#fafafa]">
          <span className="font-bold text-gray-800 text-sm">指标分类目录</span>
          <button 
            onClick={handleOpenAddRoot}
            className="text-blue-600 hover:bg-blue-100 p-1 rounded transition-colors" 
            title="添加根分类"
          >
            <Icons.Plus size={16} />
          </button>
        </div>
        <div className="p-3">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="搜索分类..." 
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-2 custom-scrollbar">
          {renderTree(categories)}
        </div>
      </div>

      {/* Right Panel: Content */}
      <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
           <div className="flex items-center gap-2 mb-6">
              <h2 className="text-lg font-bold text-gray-800">全部指标分类</h2>
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">{indicators.length}</span>
           </div>

           {/* Filter Bar */}
           <div className="bg-[#fafafa] p-4 rounded mb-4 border border-gray-100">
             <div className="flex flex-wrap items-center gap-4">
               <div className="flex items-center gap-2">
                 <label className="text-sm text-gray-600 whitespace-nowrap">指标名称:</label>
                 <input type="text" placeholder="请输入指标名称" className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-500" />
               </div>
               {/* Removed Indicator Type Filter */}
               <div className="flex items-center gap-2">
                 <label className="text-sm text-gray-600 whitespace-nowrap">数据来源:</label>
                 <select className="border border-gray-300 rounded px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-blue-500 text-gray-700 bg-white">
                   <option>全部来源</option>
                   <option>{DataSource.AUTO}</option>
                   <option>{DataSource.MANUAL}</option>
                 </select>
               </div>
               <div className="ml-auto flex gap-2">
                 <button className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:text-blue-600 hover:border-blue-600 bg-white transition-colors">重置</button>
                 <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1 transition-colors">
                   <Icons.Search size={14} /> 查询
                 </button>
               </div>
             </div>
           </div>

           {/* Action Bar */}
           <div className="flex gap-3">
             <button 
              onClick={() => setShowIndicatorModal(true)}
              className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
             >
               <Icons.Plus size={16} /> 新建指标
             </button>
             {/* Removed AI Button */}
             <button className="flex items-center gap-1 px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:text-blue-600 hover:border-blue-600 bg-white transition-colors">
               <Icons.Upload size={16} /> 导入
             </button>
             <button className="flex items-center gap-1 px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:text-blue-600 hover:border-blue-600 bg-white transition-colors">
               <Icons.Download size={16} /> 导出
             </button>
           </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#fafafa] z-10">
              <tr className="text-gray-600 text-xs font-semibold tracking-wide border-b border-gray-200">
                <th className="p-4 w-16">序号</th>
                <th className="p-4">指标名称</th>
                {/* Removed Indicator Type Header */}
                <th className="p-4 w-40">数据来源</th>
                <th className="p-4 w-32">状态 (启用/禁用)</th>
                <th className="p-4 w-32 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {indicators.map((indicator, index) => (
                <tr key={indicator.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-4 text-gray-500 text-sm">{index + 1}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-gray-800 font-medium text-sm">{indicator.name}</span>
                      <span className="text-gray-400 text-xs mt-1">{indicator.description}</span>
                    </div>
                  </td>
                  {/* Removed Indicator Type Cell */}
                  <td className="p-4 text-gray-600 text-sm flex items-center gap-1.5">
                    <Icons.Database size={14} className="text-blue-400"/>
                    {indicator.source === DataSource.AUTO ? '系统自动采集' : '人工录入'}
                  </td>
                  <td className="p-4">
                    <div className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer
                      ${indicator.status ? 'bg-[#27c24c]' : 'bg-gray-300'}
                    `}>
                      <span className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${indicator.status ? 'translate-x-6' : 'translate-x-1'}
                      `} />
                      <span className={`absolute text-[10px] text-white font-medium ${indicator.status ? 'left-1.5' : 'right-1.5'}`}>
                         {indicator.status ? '启用' : '禁用'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-blue-500 hover:text-blue-700 p-1" title="编辑"><Icons.Edit size={16} /></button>
                      <button className="text-blue-500 hover:text-blue-700 p-1" title="复制"><Icons.Copy size={16} /></button>
                      <button className="text-red-500 hover:text-red-700 p-1" title="删除"><Icons.Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-4 text-sm text-gray-600">
          <span>共 {indicators.length} 条</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 text-gray-400" disabled>&lt;</button>
            <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded">1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-600">&gt;</button>
          </div>
          <select className="border border-gray-200 rounded px-2 py-1 focus:outline-none text-gray-600">
            <option>10 条/页</option>
            <option>20 条/页</option>
            <option>50 条/页</option>
          </select>
        </div>
      </div>

      {/* Category Modal */}
      {categoryModalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {categoryModalConfig.type === 'edit' ? '编辑分类' : '添加分类'}
                </h3>
                <button onClick={() => setCategoryModalConfig({ ...categoryModalConfig, isOpen: false })} className="text-gray-400 hover:text-gray-600">
                  <Icons.Plus size={20} className="transform rotate-45" />
                </button>
             </div>
             
             <div className="mb-4">
               <label className="block text-sm font-medium text-gray-700 mb-1">分类名称</label>
               <input 
                 autoFocus
                 type="text" 
                 value={categoryModalConfig.inputValue}
                 onChange={(e) => setCategoryModalConfig({ ...categoryModalConfig, inputValue: e.target.value })}
                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                 placeholder="请输入分类名称"
               />
             </div>

             <div className="flex justify-end gap-2">
               <button 
                 onClick={() => setCategoryModalConfig({ ...categoryModalConfig, isOpen: false })}
                 className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
               >
                 取消
               </button>
               <button 
                 onClick={handleCategoryModalSave}
                 className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
               >
                 确定
               </button>
             </div>
          </div>
        </div>
      )}

      {/* NEW Indicator Modal */}
      <IndicatorModal 
        isOpen={showIndicatorModal} 
        onClose={() => setShowIndicatorModal(false)}
        onSave={handleSaveIndicator}
        categories={categories}
      />

    </div>
  );
};