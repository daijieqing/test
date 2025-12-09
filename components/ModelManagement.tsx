import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { EvaluationModel, ScoringMethod, GradeLevel, ModelIndicatorConfig, ScoringRuleType, ThresholdItem, GradeMapItem, RuleConfig, DataSource } from '../types';
import { INITIAL_INDICATORS } from './IndicatorLibrary';

// --- Mock Data Service for "Live" Preview ---
const MockDataService = {
  fetchIndicatorData: async (indicatorName: string, unit: string = '', source: DataSource) => {
    return new Promise<{ values: number[], dates: string[] }>((resolve) => {
      setTimeout(() => {
        const count = 7; // Last 7 periods
        const values: number[] = [];
        const dates: string[] = [];
        const today = new Date();
        
        let min = 0, max = 100;
        
        // Smart mock logic based on unit/name
        if (unit === '%' || indicatorName.includes('率')) {
          if (indicatorName.includes('错误') || indicatorName.includes('空缺')) {
             min = 0; max = 15; // Low percentages for negative metrics
          } else {
             min = 60; max = 98; // High percentages for positive metrics
          }
        } else if (unit.includes('时') || unit.includes('天')) {
          min = 0.5; max = 5;
        } else if (unit.includes('次') || unit === '') {
          min = 10; max = 500;
        } else if (unit === 'MB' || unit === 'GB') {
           min = 100; max = 1024;
        } else if (source === DataSource.MANUAL) {
           min = 70; max = 95; // Expert scores usually in this range
        }

        for (let i = 0; i < count; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - (count - 1 - i));
          dates.push(d.toISOString().split('T')[0].slice(5)); // MM-DD
          
          const val = Number((Math.random() * (max - min) + min).toFixed(1));
          values.push(val);
        }
        
        resolve({ values, dates });
      }, 800); // Simulate network delay
    });
  }
};

const INITIAL_MODELS: EvaluationModel[] = [
  {
    id: 'm1',
    name: '通用业务系统评价模型',
    version: 'V2.0',
    tags: [],
    description: '适用于一般业务系统的综合效能评价',
    scoringMethod: 'WEIGHTED',
    indicators: [],
    gradeLevels: [],
    enableGradeLevels: true,
    lastUpdated: '2025-01-15',
    status: 'active'
  },
  {
    id: 'm2',
    name: '基础设施项目评价模型',
    version: 'V1.0',
    tags: [],
    description: '针对底层基础设施建设项目的评价标准',
    scoringMethod: 'SUM',
    indicators: [],
    gradeLevels: [],
    enableGradeLevels: false,
    lastUpdated: '2024-11-20',
    status: 'active'
  },
  {
    id: 'm3',
    name: '数据资源类评价模型',
    version: 'V1.5',
    tags: [],
    description: '专注于数据质量和数据治理能力的评估',
    scoringMethod: 'WEIGHTED',
    indicators: [],
    gradeLevels: [],
    enableGradeLevels: true,
    lastUpdated: '2025-03-10',
    status: 'active'
  }
];

const DEFAULT_GRADE_LEVELS: GradeLevel[] = [
  { id: 'g1', name: '优秀', minScore: 90, maxScore: 100, color: '#22c55e' },
  { id: 'g2', name: '良好', minScore: 80, maxScore: 89, color: '#3b82f6' },
  { id: 'g3', name: '中等', minScore: 60, maxScore: 79, color: '#eab308' },
  { id: 'g4', name: '不合格', minScore: 0, maxScore: 59, color: '#ef4444' }
];

// --- Model Detail Drawer Component ---
const ModelDetailDrawer: React.FC<{ isOpen: boolean; onClose: () => void; model: EvaluationModel | null }> = ({ isOpen, onClose, model }) => {
  if (!isOpen || !model) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end backdrop-blur-sm animate-fade-in">
       <div className="w-[800px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right transform transition-transform duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
             <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   {model.name}
                   <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-mono">{model.version}</span>
                </h3>
                <p className="text-sm text-gray-500 mt-1">最后更新: {model.lastUpdated}</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded text-gray-500 transition-colors">
               <Icons.Plus size={24} className="rotate-45" /> 
             </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
             {/* Basic Info */}
             <section>
                <h4 className="text-sm font-bold text-gray-800 border-l-4 border-blue-600 pl-3 mb-4">基础信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                   <div><span className="text-gray-500">计分方式:</span> <span className="font-medium ml-1 text-gray-800">{model.scoringMethod === 'WEIGHTED' ? '加权求和' : '评分累加'}</span></div>
                   <div><span className="text-gray-500">指标数量:</span> <span className="font-medium ml-1 text-gray-800">{model.indicators?.length || 0} 个</span></div>
                   <div className="col-span-2"><span className="text-gray-500">模型描述:</span> <span className="ml-1 text-gray-800">{model.description || '无描述'}</span></div>
                </div>
             </section>

             {/* Indicators */}
             <section>
                <h4 className="text-sm font-bold text-gray-800 border-l-4 border-blue-600 pl-3 mb-4">指标配置详情</h4>
                <div className="space-y-3">
                   {model.indicators?.map((ind, idx) => {
                      const meta = INITIAL_INDICATORS.find(i => i.id === ind.indicatorId);
                      return (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <div className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className="text-gray-400 font-normal w-5 text-sm">{idx + 1}.</span>
                                    {meta?.name || '未知指标'}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${meta?.source === DataSource.MANUAL ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                                       {meta?.source === DataSource.MANUAL ? '人工' : '系统'}
                                    </span>
                                 </div>
                              </div>
                              <div className="font-mono font-bold text-gray-700">
                                 {model.scoringMethod === 'WEIGHTED' ? `${ind.weight}%` : `${ind.maxScore}分`}
                              </div>
                           </div>
                           
                           <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100 ml-7">
                              <span className="font-medium text-gray-500 text-xs block mb-1">评分规则:</span>
                              {ind.scoringRuleDesc || '暂无详细规则描述'}
                           </div>
                        </div>
                      );
                   })}
                   {(!model.indicators || model.indicators.length === 0) && <div className="text-center text-gray-400 py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">暂无配置指标</div>}
                </div>
             </section>

             {/* Grade Levels */}
             {model.enableGradeLevels && (
                <section>
                   <h4 className="text-sm font-bold text-gray-800 border-l-4 border-blue-600 pl-3 mb-4">等级定义</h4>
                   <div className="flex flex-wrap gap-3">
                      {model.gradeLevels.map(gl => (
                         <div key={gl.id} className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-200 bg-white shadow-sm">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: gl.color}}></div>
                            <span className="font-bold text-gray-700">{gl.name}</span>
                            <span className="text-xs text-gray-500">({gl.minScore}~{gl.maxScore})</span>
                         </div>
                      ))}
                      {model.gradeLevels.length === 0 && <div className="text-gray-400 text-sm">未设置具体等级</div>}
                   </div>
                </section>
             )}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
             <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm text-gray-700 transition-colors shadow-sm">关闭</button>
          </div>
       </div>
    </div>
  );
};

// --- History Modal Component ---
interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: EvaluationModel | null;
  onViewDetail: (version: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, model, onViewDetail }) => {
  if (!isOpen || !model) return null;

  // Mock history data based on current model
  const history = [
    { version: model.version, date: model.lastUpdated, operator: '张小六', versionDescription: '当前生效版本' },
    { version: 'V' + (parseFloat(model.version.replace('V','')) - 0.5).toFixed(1), date: '2024-10-01', operator: '李四', versionDescription: '调整了权重配置' },
    { version: 'V1.0', date: '2024-01-15', operator: '王五', versionDescription: '初始创建' }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-[600px] animate-fade-in flex flex-col max-h-[80vh]">
         <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <div>
               <h3 className="text-lg font-bold text-gray-800">版本历史</h3>
               <p className="text-xs text-gray-500 mt-1">{model.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icons.Plus size={24} className="rotate-45"/></button>
         </div>
         <div className="flex-1 overflow-y-auto p-6">
            <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
               {history.map((h, i) => (
                 <div key={i} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${i === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                             <span className={`text-sm font-bold ${i === 0 ? 'text-blue-600' : 'text-gray-700'}`}>{h.version}</span>
                             {i === 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">当前</span>}
                          </div>
                          <span className="text-xs text-gray-400">{h.date}</span>
                       </div>
                       
                       {/* Version Description Display */}
                       <p className="text-sm text-gray-700 font-medium mb-2">{h.versionDescription}</p>

                       <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                             <Icons.Users size={12}/> 操作人: {h.operator}
                          </div>
                          <button 
                            onClick={() => onViewDetail(h.version)}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                             <Icons.Search size={12} /> 查看详情
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
         <div className="p-4 border-t border-gray-100 flex justify-end">
           <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors">关闭</button>
         </div>
      </div>
    </div>
  );
};

export const ModelManagement: React.FC = () => {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [models, setModels] = useState<EvaluationModel[]>(INITIAL_MODELS);
  const [currentModel, setCurrentModel] = useState<EvaluationModel | null>(null);
  
  // List View States
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historyModel, setHistoryModel] = useState<EvaluationModel | null>(null);

  // Detail Drawer State
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [detailModel, setDetailModel] = useState<EvaluationModel | null>(null);

  // Editor State
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Partial<EvaluationModel>>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateModel = () => {
    setCurrentModel(null);
    setFormData({
      name: '',
      version: 'V1.0', // Auto-generated default
      scoringMethod: 'WEIGHTED',
      indicators: [],
      gradeLevels: DEFAULT_GRADE_LEVELS,
      enableGradeLevels: true,
      tags: [],
      description: ''
    });
    setActiveStep(0);
    setView('editor');
  };

  const handleEditModel = (model: EvaluationModel) => {
    setCurrentModel(model);
    setFormData(JSON.parse(JSON.stringify(model))); // Deep copy
    setActiveStep(0);
    setView('editor');
  };

  const handleDeleteModel = (id: string) => {
    if (confirm('确定要删除该模型吗？删除后不可恢复。')) {
      setModels(models.filter(m => m.id !== id));
      setActiveDropdownId(null);
    }
  };

  const handleCopyModel = (model: EvaluationModel) => {
    const newModel: EvaluationModel = {
      ...model,
      id: `m-${Date.now()}`,
      name: `${model.name} (副本)`,
      version: 'V1.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    setModels([...models, newModel]);
    setActiveDropdownId(null);
  };

  const handleViewHistory = (e: React.MouseEvent, model: EvaluationModel) => {
    e.stopPropagation();
    setHistoryModel(model);
    setShowHistory(true);
  };

  const handleViewModelDetail = (e: React.MouseEvent, model: EvaluationModel) => {
    e.stopPropagation();
    setDetailModel(model);
    setShowDetailDrawer(true);
  };

  // Called from History Modal
  const handleViewHistoryDetail = (version: string) => {
    if (!historyModel) return;
    
    // Create a mock historical model object
    const historicalModel: EvaluationModel = {
      ...historyModel,
      version: version,
      // For demo purposes, we just modify description to indicate it's historical
      description: `[历史版本 ${version}] ${historyModel.description}`,
      // In a real app, you would fetch the full snapshot from backend
    };
    
    setDetailModel(historicalModel);
    setShowDetailDrawer(true);
  };

  const handleSaveModel = () => {
    if (!formData.name) return alert('请输入模型名称');
    
    // Auto increment version logic could go here, for now simpler logic
    let version = formData.version;
    if (currentModel && view === 'editor') {
       // Simple version bump simulation
       // const vNum = parseFloat(version?.replace('V', '') || '1.0');
       // version = `V${(vNum + 0.1).toFixed(1)}`;
    }

    const newModel: EvaluationModel = {
      ...formData as EvaluationModel,
      version: version || 'V1.0',
      id: currentModel?.id || `m-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    if (currentModel) {
      setModels(models.map(m => m.id === currentModel.id ? newModel : m));
    } else {
      setModels([...models, newModel]);
    }
    setView('list');
  };

  const handleNextStep = () => {
    if (activeStep < 2) setActiveStep(activeStep + 1);
    else handleSaveModel();
  };

  const handlePrevStep = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  // --- Sub-components for Wizard Steps ---

  const StepBasicInfo = () => (
    <div className="space-y-6 max-w-3xl mx-auto py-6">
       <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">模型名称 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="请输入模型名称"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">当前版本 (自动生成)</label>
            <div className="w-full bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 cursor-not-allowed">
              {formData.version || 'V1.0'}
            </div>
          </div>
       </div>

       <div className="space-y-1">
          <label className="block text-sm font-bold text-gray-700">模型描述</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 h-24 resize-none"
            placeholder="描述该模型的适用场景和评价对象..."
          />
       </div>

       <div className="space-y-1">
          <label className="block text-sm font-bold text-gray-700">计分方式 <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => setFormData({ ...formData, scoringMethod: 'WEIGHTED' })}
              className={`border rounded p-4 cursor-pointer transition-all flex items-start gap-3 ${formData.scoringMethod === 'WEIGHTED' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
            >
               <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${formData.scoringMethod === 'WEIGHTED' ? 'border-blue-600' : 'border-gray-400'}`}>
                 {formData.scoringMethod === 'WEIGHTED' && <div className="w-2 h-2 bg-blue-600 rounded-full"/>}
               </div>
               <div>
                 <span className="block font-medium text-gray-800 text-sm">加权求和 (Weighted Sum)</span>
                 <span className="text-xs text-gray-500 mt-1">各指标设置权重，总分为100%或特定分值，根据权重计算总分。</span>
               </div>
            </div>
            <div 
              onClick={() => setFormData({ ...formData, scoringMethod: 'SUM' })}
              className={`border rounded p-4 cursor-pointer transition-all flex items-start gap-3 ${formData.scoringMethod === 'SUM' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
            >
               <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${formData.scoringMethod === 'SUM' ? 'border-blue-600' : 'border-gray-400'}`}>
                 {formData.scoringMethod === 'SUM' && <div className="w-2 h-2 bg-blue-600 rounded-full"/>}
               </div>
               <div>
                 <span className="block font-medium text-gray-800 text-sm">评分累加 (Score Sum)</span>
                 <span className="text-xs text-gray-500 mt-1">各指标设置具体分值，总分无上限或由指标总分决定。</span>
               </div>
            </div>
          </div>
       </div>
    </div>
  );

  // --- Step 2: Indicator & Rules Configuration ---
  const StepIndicators = () => {
    const [selectedIndId, setSelectedIndId] = useState<string | null>(formData.indicators?.[0]?.indicatorId || null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set());
    
    // Live Preview State
    const [previewData, setPreviewData] = useState<{values: number[], dates: string[], stats: {min: number, max: number, avg: string}} | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isProbeExpanded, setIsProbeExpanded] = useState(false); // Controls visibility of the large chart

    // Derived states
    const activeIndicatorConfig = formData.indicators?.find(i => i.indicatorId === selectedIndId);
    const activeIndicatorMeta = INITIAL_INDICATORS.find(i => i.id === selectedIndId);
    const isManual = activeIndicatorMeta?.source === DataSource.MANUAL;
    
    const totalWeight = formData.indicators?.reduce((sum, item) => sum + (item.weight || 0), 0) || 0;
    
    // Reset preview when indicator changes
    useEffect(() => {
      setPreviewData(null);
      setIsProbeExpanded(false); // Default to collapsed
    }, [selectedIndId]);

    const handleLoadPreviewData = async () => {
       if (!activeIndicatorMeta) return;
       setIsLoadingPreview(true);
       setIsProbeExpanded(true); // Expand when loading starts
       try {
         const data = await MockDataService.fetchIndicatorData(
           activeIndicatorMeta.name, 
           activeIndicatorMeta.unit,
           activeIndicatorMeta.source
         );
         const sum = data.values.reduce((a, b) => a + b, 0);
         const avg = (sum / data.values.length).toFixed(1);
         const min = Math.min(...data.values);
         const max = Math.max(...data.values);
         
         setPreviewData({
           ...data,
           stats: { min, max, avg }
         });
       } catch (e) {
         console.error(e);
       } finally {
         setIsLoadingPreview(false);
       }
    };

    // Helper to generate text description
    const getSmartInterpretation = (config: ModelIndicatorConfig): string => {
      if (!config.ruleType || !config.ruleConfig) return '';
      
      const { ruleType, ruleConfig } = config;
      
      switch (ruleType) {
        case 'THRESHOLD':
          const tList = ruleConfig.thresholds?.map((t, i) => {
             let opStr = '';
             if (t.operator === 'range') opStr = `${t.value1} ~ ${t.value2}`;
             else opStr = `${t.operator} ${t.value1}`;
             return `[${i+1}] 指标值 ${opStr} 得 ${t.score}分`;
          }).join('; ');
          return tList || '暂无阈值配置';
        case 'RATIO':
          if (ruleConfig.ratioType === 'DEDUCTION') {
             return `反向计分：得分 = 基础分(${ruleConfig.ratioBase || 100}) - (指标值 × 系数${ruleConfig.ratioCoefficient || 1})。${ruleConfig.ratioMin !== undefined ? `最低得${ruleConfig.ratioMin}分` : ''}。`;
          }
          return `正向计分：得分 = 指标值 × 系数(${ruleConfig.ratioCoefficient || 1})。${ruleConfig.ratioMin !== undefined ? `最低分${ruleConfig.ratioMin}分` : ''}${ruleConfig.ratioMax ? `，最高分${ruleConfig.ratioMax}分` : ''}。`;
        case 'GRADE_MAP':
          const gList = ruleConfig.gradeMapping?.map(g => `${g.gradeName}=${g.score}分`).join('，');
          return `文本映射：${gList || '暂无映射'}`;
        case 'DEDUCTION':
           return `基准分${ruleConfig.deductionBase || 10}分。每违规1次扣${ruleConfig.deductionPerUnit || 1}分。${ruleConfig.deductionMin !== undefined ? `最低得${ruleConfig.deductionMin}分` : ''}。`;
        case 'BONUS':
           return `当指标达到${ruleConfig.bonusTrigger}%时触发加分。每增加1单位加${ruleConfig.bonusPerUnit}分。封顶加${ruleConfig.bonusCap}分。`;
        default:
          return '';
      }
    };

    const smartText = activeIndicatorConfig ? getSmartInterpretation(activeIndicatorConfig) : '';

    const confirmAddIndicators = () => {
       const newConfigs: ModelIndicatorConfig[] = [];
       tempSelectedIds.forEach(id => {
         if (!formData.indicators?.find(i => i.indicatorId === id)) {
           newConfigs.push({ 
             indicatorId: id, 
             weight: 0, 
             maxScore: 10,
             ruleType: 'THRESHOLD', // Default rule
             ruleConfig: { thresholds: [], ratioType: 'PROPORTIONAL' },
             requireEvidence: false,
             enableEvidence: false,
             scoringRuleDesc: ''
           });
         }
       });
       
       if (newConfigs.length > 0) {
         setFormData({
           ...formData,
           indicators: [...(formData.indicators || []), ...newConfigs]
         });
         // Auto select the first new one if none selected
         if (!selectedIndId) setSelectedIndId(newConfigs[0].indicatorId);
       }
       setIsSelectorOpen(false);
       setTempSelectedIds(new Set());
    };

    const toggleTempSelection = (id: string) => {
      const newSet = new Set(tempSelectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setTempSelectedIds(newSet);
    };

    const removeIndicator = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newIndicators = formData.indicators?.filter(i => i.indicatorId !== id) || [];
      setFormData({ ...formData, indicators: newIndicators });
      if (selectedIndId === id) {
        setSelectedIndId(newIndicators[0]?.indicatorId || null);
      }
    };

    const updateActiveConfig = (updates: Partial<ModelIndicatorConfig>) => {
      setFormData({
        ...formData,
        indicators: formData.indicators?.map(i => i.indicatorId === selectedIndId ? { ...i, ...updates } : i)
      });
    };

    const updateRuleConfig = (updates: Partial<RuleConfig>) => {
      if (!activeIndicatorConfig) return;
      updateActiveConfig({
        ruleConfig: { ...activeIndicatorConfig.ruleConfig, ...updates }
      });
    };

    // --- Sub-renderers for Rule Forms ---
    
    const renderThresholdForm = () => {
      const thresholds = activeIndicatorConfig?.ruleConfig?.thresholds || [];
      const addThreshold = () => {
        const newT: ThresholdItem = { id: Date.now().toString(), operator: '<=', value1: 80, score: 0 };
        updateRuleConfig({ thresholds: [...thresholds, newT] });
      };
      const removeThreshold = (tid: string) => {
        updateRuleConfig({ thresholds: thresholds.filter(t => t.id !== tid) });
      };
      const updateThreshold = (tid: string, field: keyof ThresholdItem, val: any) => {
        updateRuleConfig({ thresholds: thresholds.map(t => t.id === tid ? { ...t, [field]: val } : t) });
      };

      return (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">定义不同区间对应的得分 (支持多区间)</span>
            <button onClick={addThreshold} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              <Icons.Plus size={12}/> 添加区间
            </button>
          </div>
          {thresholds.map((t, idx) => (
            <div key={t.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
               <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
               
               <select 
                 value={t.operator}
                 onChange={(e) => updateThreshold(t.id, 'operator', e.target.value)}
                 className="border rounded text-sm py-1 px-1 w-20"
               >
                 <option value="<">&lt;</option>
                 <option value="<=">≤</option>
                 <option value=">">&gt;</option>
                 <option value=">=">≥</option>
                 <option value="range">Range</option>
               </select>

               {t.operator === 'range' ? (
                 <div className="flex items-center gap-1">
                   <input type="number" className="w-16 border rounded p-1 text-sm" value={t.value1} onChange={(e) => updateThreshold(t.id, 'value1', Number(e.target.value))} />
                   <span className="text-gray-400">~</span>
                   <input type="number" className="w-16 border rounded p-1 text-sm" value={t.value2 || 0} onChange={(e) => updateThreshold(t.id, 'value2', Number(e.target.value))} />
                 </div>
               ) : (
                 <input type="number" className="w-20 border rounded p-1 text-sm" value={t.value1} onChange={(e) => updateThreshold(t.id, 'value1', Number(e.target.value))} />
               )}

               <span className="text-sm text-gray-600 ml-2">得</span>
               <input type="number" className="w-16 border rounded p-1 text-sm" value={t.score} onChange={(e) => updateThreshold(t.id, 'score', Number(e.target.value))} />
               <span className="text-sm text-gray-600">分</span>

               <button onClick={() => removeThreshold(t.id)} className="ml-auto text-gray-400 hover:text-red-500"><Icons.Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      );
    };

    const renderRatioForm = () => {
      const { ratioCoefficient = 1, ratioMin, ratioMax, ratioType = 'PROPORTIONAL', ratioBase = 100 } = activeIndicatorConfig?.ruleConfig || {};
      
      return (
        <div className="space-y-4">
           {/* Logic Type Toggle */}
           <div className="flex p-1 bg-gray-100 rounded text-xs mb-3">
             <button 
               onClick={() => updateRuleConfig({ ratioType: 'PROPORTIONAL' })}
               className={`flex-1 py-1.5 rounded text-center transition-all ${ratioType === 'PROPORTIONAL' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
             >
               正向计分 (线性)
             </button>
             <button 
               onClick={() => updateRuleConfig({ ratioType: 'DEDUCTION' })}
               className={`flex-1 py-1.5 rounded text-center transition-all ${ratioType === 'DEDUCTION' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
             >
               反向扣分 (减法)
             </button>
           </div>

           <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-600">
             {ratioType === 'PROPORTIONAL' 
                ? '得分 = 指标值 × 系数'
                : `得分 = 基础分(${ratioBase}) - (指标值 × 系数)`
             }
           </div>

           <div className="grid grid-cols-2 gap-4">
              {ratioType === 'DEDUCTION' && (
                <div>
                   <label className="block text-xs text-gray-500 mb-1">基础分 (Base)</label>
                   <input 
                     type="number" 
                     value={ratioBase}
                     onChange={(e) => updateRuleConfig({ ratioBase: parseFloat(e.target.value) })}
                     className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                   />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">计算系数 (Coefficient)</label>
                <input 
                  type="number" 
                  value={ratioCoefficient}
                  step="0.1"
                  onChange={(e) => updateRuleConfig({ ratioCoefficient: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                 <label className="block text-xs text-gray-500 mb-1">最低得分 (Floor)</label>
                 <input 
                   type="number" 
                   value={ratioMin || 0}
                   onChange={(e) => updateRuleConfig({ ratioMin: parseFloat(e.target.value) })}
                   className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                   placeholder="0"
                 />
              </div>
              {ratioType === 'PROPORTIONAL' && (
                <div>
                   <label className="block text-xs text-gray-500 mb-1">最高得分 (Ceiling)</label>
                   <input 
                     type="number" 
                     value={ratioMax || 10}
                     onChange={(e) => updateRuleConfig({ ratioMax: parseFloat(e.target.value) })}
                     className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                   />
                </div>
              )}
           </div>
        </div>
      );
    };

    const renderGradeForm = () => {
      const mapping = activeIndicatorConfig?.ruleConfig?.gradeMapping || [];
      const addMap = () => updateRuleConfig({ gradeMapping: [...mapping, { id: Date.now().toString(), gradeName: '', score: 0 }] });
      const removeMap = (id: string) => updateRuleConfig({ gradeMapping: mapping.filter(m => m.id !== id) });
      const updateMap = (id: string, field: keyof GradeMapItem, val: any) => updateRuleConfig({ gradeMapping: mapping.map(m => m.id === id ? { ...m, [field]: val } : m) });

      return (
        <div className="space-y-3">
           <div className="flex justify-between items-center">
             <span className="text-xs text-gray-500">文本值映射分数 (如 优秀 -> 10)</span>
             <button onClick={addMap} className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><Icons.Plus size={12}/> 添加映射</button>
           </div>
           {mapping.map(m => (
             <div key={m.id} className="flex items-center gap-2">
               <input 
                 placeholder="等级名称 (如: 优秀)"
                 value={m.gradeName} 
                 onChange={(e) => updateMap(m.id, 'gradeName', e.target.value)}
                 className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
               />
               <Icons.ArrowLeft size={14} className="text-gray-400 rotate-180" />
               <input 
                 type="number"
                 placeholder="得分"
                 value={m.score}
                 onChange={(e) => updateMap(m.id, 'score', parseFloat(e.target.value))}
                 className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm"
               />
               <button onClick={() => removeMap(m.id)} className="text-gray-400 hover:text-red-500"><Icons.Trash2 size={16} /></button>
             </div>
           ))}
        </div>
      );
    };

    const renderDeductionForm = () => {
      const { deductionBase = 10, deductionPerUnit = 1, deductionMin = 0 } = activeIndicatorConfig?.ruleConfig || {};
      return (
        <div className="space-y-4">
           <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-600">
             得分 = 基础分 - (违规次数 × 单次扣分)
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">基础分 (Base)</label>
                <input 
                  type="number" 
                  value={deductionBase}
                  onChange={(e) => updateRuleConfig({ deductionBase: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">单次扣分</label>
                <input 
                  type="number" 
                  value={deductionPerUnit}
                  onChange={(e) => updateRuleConfig({ deductionPerUnit: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最低得分 (Min Limit)</label>
                <input 
                  type="number" 
                  value={deductionMin}
                  onChange={(e) => updateRuleConfig({ deductionMin: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
           </div>
        </div>
      );
    };

    const renderBonusForm = () => {
      const { bonusTrigger = 100, bonusPerUnit = 1, bonusCap = 5 } = activeIndicatorConfig?.ruleConfig || {};
      return (
        <div className="space-y-4">
           <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-600">
             触发条件: 指标值 ≥ {bonusTrigger}% -> 附加分
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs text-gray-500 mb-1">触发阈值 (%)</label>
               <input 
                  type="number" 
                  value={bonusTrigger}
                  onChange={(e) => updateRuleConfig({ bonusTrigger: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
             </div>
             <div>
               <label className="block text-xs text-gray-500 mb-1">每单位加分</label>
               <input 
                  type="number" 
                  value={bonusPerUnit}
                  onChange={(e) => updateRuleConfig({ bonusPerUnit: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
             </div>
             <div>
               <label className="block text-xs text-gray-500 mb-1">封顶附加分</label>
               <input 
                  type="number" 
                  value={bonusCap}
                  onChange={(e) => updateRuleConfig({ bonusCap: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
             </div>
           </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col h-full overflow-hidden">
         {/* Top Bar */}
         <div className="flex justify-between items-center mb-4 px-1">
           <div className="flex gap-2">
             <button 
               onClick={() => setIsSelectorOpen(true)}
               className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm"
             >
               <Icons.Plus size={16} /> 选择/添加指标
             </button>
           </div>
           <div className="text-sm">
             {formData.scoringMethod === 'WEIGHTED' ? (
               <span className={`font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-500'}`}>
                 当前总权重: {totalWeight}% {totalWeight !== 100 && '(需等于100%)'}
               </span>
             ) : (
               <span className="text-gray-600 font-bold">已选指标: {formData.indicators?.length} 个</span>
             )}
           </div>
         </div>

         {/* Master-Detail Layout */}
         <div className="flex flex-1 gap-4 overflow-hidden border border-gray-200 rounded-lg bg-white relative">
            
            {/* Drawer for Adding Indicators */}
            {isSelectorOpen && (
              <div className="absolute inset-y-0 left-0 w-80 bg-white z-20 border-r border-gray-200 shadow-xl animate-slide-in-left flex flex-col">
                <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                  <span className="font-bold text-gray-700 text-sm">选择指标库指标</span>
                  <button onClick={() => setIsSelectorOpen(false)}><Icons.Plus className="rotate-45 text-gray-500" size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {INITIAL_INDICATORS.map(ind => {
                    const isAlreadyAdded = formData.indicators?.some(i => i.indicatorId === ind.id);
                    const isSelected = tempSelectedIds.has(ind.id);
                    return (
                       <div 
                        key={ind.id} 
                        onClick={() => !isAlreadyAdded && toggleTempSelection(ind.id)}
                        className={`p-3 rounded border text-sm cursor-pointer transition-colors flex items-start gap-2
                          ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : 
                            isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300 hover:shadow-sm border-gray-200'}
                        `}
                       >
                         <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                           ${isAlreadyAdded ? 'border-gray-300 bg-gray-200' : isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-400 bg-white'}
                         `}>
                           {(isAlreadyAdded || isSelected) && <Icons.Check size={10} className="text-white"/>}
                         </div>
                         <div>
                            <div className="font-medium text-gray-800">{ind.name}</div>
                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">{ind.description}</div>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{ind.category}</span>
                              <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{ind.source === DataSource.AUTO ? '系统采集' : '人工录入'}</span>
                            </div>
                         </div>
                       </div>
                    );
                  })}
                </div>
                <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
                   <span className="text-xs text-gray-500">已选: {tempSelectedIds.size}</span>
                   <button 
                     onClick={confirmAddIndicators}
                     disabled={tempSelectedIds.size === 0}
                     className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     确认添加
                   </button>
                </div>
              </div>
            )}

            {/* Left Panel: Selected List */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50/50 flex flex-col min-w-[250px]">
               <div className="p-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">已选配置列表</div>
               <div className="flex-1 overflow-y-auto">
                 {formData.indicators?.length === 0 ? (
                   <div className="text-center p-8 text-gray-400 text-sm">暂无指标，请点击左上角添加</div>
                 ) : (
                   formData.indicators?.map(item => {
                     const meta = INITIAL_INDICATORS.find(i => i.id === item.indicatorId);
                     const isActive = selectedIndId === item.indicatorId;
                     return (
                       <div 
                         key={item.indicatorId}
                         onClick={() => setSelectedIndId(item.indicatorId)}
                         className={`p-3 border-b border-gray-100 cursor-pointer transition-all relative group
                           ${isActive ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}
                         `}
                       >
                          <div className="flex justify-between items-start">
                             <div className="font-medium text-gray-800 text-sm truncate pr-2" title={meta?.name}>{meta?.name}</div>
                             <button 
                               onClick={(e) => removeIndicator(e, item.indicatorId)}
                               className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                               <Icons.Trash2 size={14}/>
                             </button>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                             {/* Source Badge */}
                             {meta?.source === DataSource.MANUAL ? (
                                <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">[人工录入]</span>
                             ) : (
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">[系统采集]</span>
                             )}

                             {meta?.source === DataSource.MANUAL ? (
                               <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">人工评分</span>
                             ) : (
                               <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                                {item.ruleType === 'THRESHOLD' ? '阈值得分' : 
                                  item.ruleType === 'RATIO' ? (item.ruleConfig?.ratioType === 'DEDUCTION' ? '比率扣分' : '比率得分') :
                                  item.ruleType === 'GRADE_MAP' ? '等级映射' :
                                  item.ruleType === 'DEDUCTION' ? '容错扣分' : '附加分'}
                               </span>
                             )}
                             
                             {formData.scoringMethod === 'WEIGHTED' && (
                               <span className={`px-1.5 py-0.5 rounded ${item.weight ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                 {item.weight}%
                               </span>
                             )}
                          </div>
                       </div>
                     );
                   })
                 )}
               </div>
            </div>

            {/* Right Panel: Detail Config */}
            <div className="flex-1 bg-white flex flex-col">
               {selectedIndId && activeIndicatorConfig ? (
                 <>
                   <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase
                          ${isManual ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}
                        `}>
                          {isManual ? 'Manual' : 'Auto'}
                        </span>
                        <h3 className="font-bold text-gray-800 text-lg truncate">
                          {activeIndicatorMeta?.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{activeIndicatorMeta?.description}</p>
                   </div>
                   
                   <div className="p-6 flex-1 overflow-y-auto">
                      {/* Live Data Preview Section (Collapsible & Hidden for Manual) */}
                      {!isManual && (
                        <div className="mb-6">
                          {!isProbeExpanded ? (
                             // Collapsed / Helper View
                             <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex justify-between items-center transition-all hover:shadow-sm">
                                <div className="flex items-center gap-2 text-sm text-blue-800">
                                   <div className="p-1 bg-white rounded-full"><Icons.BarChart2 size={14} className="text-blue-500"/></div>
                                   <span className="font-medium">配置辅助:</span>
                                   <span className="text-blue-600/80 text-xs">连接数据源查看历史数据分布，辅助规则设定。</span>
                                </div>
                                <button 
                                  onClick={handleLoadPreviewData}
                                  className="text-xs bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <Icons.Database size={12}/> 查看数据分布
                                </button>
                             </div>
                          ) : (
                             // Expanded Chart View
                             <div className="bg-[#f8fafc] border border-blue-100 rounded-lg p-4 relative overflow-hidden animate-fade-in shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                   <div>
                                      <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Icons.BarChart2 size={16} className="text-blue-500"/>
                                        数据分布预览 (Data Probe)
                                      </h4>
                                   </div>
                                   <div className="flex items-center gap-2">
                                      <button 
                                        onClick={handleLoadPreviewData}
                                        disabled={isLoadingPreview}
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        {isLoadingPreview ? '加载中...' : '刷新数据'}
                                      </button>
                                      <button 
                                        onClick={() => setIsProbeExpanded(false)}
                                        className="text-gray-400 hover:text-gray-600 p-1"
                                        title="收起"
                                      >
                                        <Icons.Check size={16} className="rotate-45" /> {/* Using check rotated as close for simplicity or replace with dedicated X icon if available, but here reuse existing */}
                                      </button>
                                   </div>
                                </div>

                                {isLoadingPreview ? (
                                   <div className="h-32 flex items-center justify-center text-gray-400 text-xs gap-2">
                                      <Icons.MoreHorizontal className="animate-spin" size={16}/> 正在从数据源获取样本...
                                   </div>
                                ) : previewData ? (
                                   <div>
                                      <div className="flex items-end gap-1 h-24 mb-2 pb-1 border-b border-gray-200">
                                         {previewData.values.map((val, idx) => {
                                            // Simple visualization
                                            const heightPercent = Math.max(10, (val / previewData.stats.max) * 100);
                                            return (
                                              <div key={idx} className="flex-1 flex flex-col justify-end group relative cursor-help">
                                                 <div 
                                                   className="w-full bg-blue-200 hover:bg-blue-400 transition-colors rounded-t-sm" 
                                                   style={{ height: `${heightPercent}%` }} 
                                                 ></div>
                                                 {/* Tooltip */}
                                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg">
                                                    {previewData.dates[idx]}: {val} {activeIndicatorMeta?.unit}
                                                 </div>
                                              </div>
                                            );
                                         })}
                                      </div>
                                      <div className="flex justify-between text-xs text-gray-500">
                                         <span>近7期数据统计</span>
                                         <div className="flex gap-3">
                                            <span className="font-medium text-gray-700">Max: {previewData.stats.max}</span>
                                            <span className="font-medium text-gray-700">Min: {previewData.stats.min}</span>
                                            <span className="font-medium text-blue-600">Avg: {previewData.stats.avg}</span>
                                         </div>
                                      </div>
                                      <div className="mt-2 pt-2 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                                         <span>单位: <strong className="text-gray-700">{activeIndicatorMeta?.unit || '-'}</strong></span>
                                         <span>类型: <strong className="text-gray-700">{activeIndicatorMeta?.type === 'Quantitative' ? '数值型' : '文本型'}</strong></span>
                                      </div>
                                   </div>
                                ) : (
                                   <div className="flex flex-col items-center justify-center h-24 text-gray-400 text-xs">
                                      暂无数据
                                   </div>
                                )}
                             </div>
                          )}
                        </div>
                      )}

                      {/* Common Score Config */}
                      <div className="grid grid-cols-2 gap-6 mb-6">
                         {formData.scoringMethod === 'WEIGHTED' ? (
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">权重 (%) <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <input 
                                  type="number"
                                  min="0" max="100"
                                  value={activeIndicatorConfig.weight}
                                  onChange={(e) => updateActiveConfig({ weight: parseFloat(e.target.value) })}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 pr-8"
                                />
                                <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                              </div>
                           </div>
                         ) : (
                           // For SUM method, we need the Max Score
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                此项分值 (满分)
                              </label>
                              <input 
                                type="number"
                                value={activeIndicatorConfig.maxScore}
                                onChange={(e) => updateActiveConfig({ maxScore: parseFloat(e.target.value) })}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              />
                           </div>
                         )}
                      </div>

                      {/* Config Area Based on Source Type */}
                      {isManual ? (
                        <div className="space-y-6">
                           <div className="bg-orange-50 border border-orange-100 rounded p-4">
                             <h4 className="font-bold text-orange-800 text-sm mb-3">人工评分配置</h4>
                             
                             <div className="space-y-3">
                               <label className="flex items-center gap-2 cursor-pointer">
                                 <input 
                                   type="checkbox"
                                   checked={activeIndicatorConfig.enableEvidence || false}
                                   onChange={(e) => updateActiveConfig({ enableEvidence: e.target.checked })}
                                   className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                 />
                                 <span className="text-sm text-gray-700 font-medium">开启“证明材料”上传入口</span>
                               </label>
                               
                               {activeIndicatorConfig.enableEvidence && (
                                 <div className="ml-6 pl-3 border-l-2 border-orange-200">
                                   <label className="flex items-center gap-2 cursor-pointer">
                                     <input 
                                       type="checkbox"
                                       checked={activeIndicatorConfig.requireEvidence || false}
                                       onChange={(e) => updateActiveConfig({ requireEvidence: e.target.checked })}
                                       className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                     />
                                     <span className="text-sm text-gray-700">评分时必须上传材料 (强制校验)</span>
                                   </label>
                                 </div>
                               )}
                             </div>
                           </div>

                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">评分规则说明 (指导人工打分)</label>
                              <textarea
                                value={activeIndicatorConfig.scoringRuleDesc || ''}
                                onChange={(e) => updateActiveConfig({ scoringRuleDesc: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 h-32 resize-none"
                                placeholder="请输入具体的评分标准，例如：优(90-100分)：材料齐全...；良(80-89分)：..."
                              />
                           </div>
                        </div>
                      ) : (
                        // AUTO Config
                        <div className="space-y-6">
                           {/* Rule Type Selector */}
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">评分规则类型</label>
                              <div className="grid grid-cols-3 gap-3">
                                 {[
                                   { id: 'THRESHOLD', label: '阈值得分', desc: '按区间判断' },
                                   { id: 'RATIO', label: '比率得分', desc: '线性/扣分计算' },
                                   { id: 'GRADE_MAP', label: '等级映射', desc: '文字转分' },
                                   { id: 'DEDUCTION', label: '容错扣分', desc: '违规扣分' },
                                   { id: 'BONUS', label: '附加规则', desc: '超额加分' },
                                 ].map(rule => (
                                   <div 
                                     key={rule.id}
                                     onClick={() => updateActiveConfig({ ruleType: rule.id as ScoringRuleType })}
                                     className={`
                                       border rounded p-3 cursor-pointer transition-all
                                       ${activeIndicatorConfig.ruleType === rule.id 
                                         ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                                         : 'border-gray-200 hover:border-blue-300'}
                                     `}
                                   >
                                      <div className="text-sm font-medium text-gray-800 mb-0.5">{rule.label}</div>
                                      <div className="text-xs text-gray-500">{rule.desc}</div>
                                   </div>
                                 ))}
                              </div>
                           </div>

                           {/* Rule Specific Form */}
                           <div className="bg-white rounded border border-gray-200 p-4 shadow-sm relative">
                              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l"></div>
                              <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Icons.Settings size={16} /> 规则详情配置
                              </h4>
                              
                              {activeIndicatorConfig.ruleType === 'THRESHOLD' && renderThresholdForm()}
                              {activeIndicatorConfig.ruleType === 'RATIO' && renderRatioForm()}
                              {activeIndicatorConfig.ruleType === 'GRADE_MAP' && renderGradeForm()}
                              {activeIndicatorConfig.ruleType === 'DEDUCTION' && renderDeductionForm()}
                              {activeIndicatorConfig.ruleType === 'BONUS' && renderBonusForm()}

                              {/* Smart Interpretation */}
                              <div className="mt-6 pt-4 border-t border-gray-100">
                                 <div className="flex justify-between items-center mb-2">
                                   <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                     <Icons.Bot size={12} className="text-purple-500"/> 规则智能解读
                                   </label>
                                   <button 
                                     onClick={() => updateActiveConfig({ scoringRuleDesc: smartText })}
                                     className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                   >
                                     <Icons.Copy size={12} /> 复制到说明
                                   </button>
                                 </div>
                                 <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 leading-relaxed border border-gray-200">
                                   {smartText || '配置规则后自动生成解读'}
                                 </div>
                              </div>
                           </div>

                           {/* Final Description */}
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">评分规则说明 (用于展示)</label>
                              <textarea
                                value={activeIndicatorConfig.scoringRuleDesc || ''}
                                onChange={(e) => updateActiveConfig({ scoringRuleDesc: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 h-20 resize-none"
                                placeholder="可点击上方“复制”按钮填充，或手动编辑..."
                              />
                           </div>
                        </div>
                      )}
                   </div>
                 </>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Icons.ArrowLeft size={32} className="mb-2 opacity-20"/>
                    <p>请在左侧选择一个指标进行详细配置</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    );
  };

  // --- Step 3: Configuration Review & Grade Settings ---
  const StepReviewAndSettings = () => {
    const gradeLevels = formData.gradeLevels || [];

    const updateGradeLevel = (id: string, field: keyof GradeLevel, value: any) => {
      const newLevels = gradeLevels.map(gl => gl.id === id ? { ...gl, [field]: value } : gl);
      setFormData({ ...formData, gradeLevels: newLevels });
    };

    const addGradeLevel = () => {
      const newLevel: GradeLevel = {
        id: Date.now().toString(),
        name: '新等级',
        minScore: 0,
        maxScore: 10,
        color: '#94a3b8'
      };
      setFormData({ ...formData, gradeLevels: [...gradeLevels, newLevel] });
    };

    const removeGradeLevel = (id: string) => {
      setFormData({ ...formData, gradeLevels: gradeLevels.filter(gl => gl.id !== id) });
    };

    return (
      <div className="max-w-6xl mx-auto py-6 space-y-6 h-full flex flex-col">
         {/* 1. Preview Section (New) */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Info Card */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Icons.FileText size={18} className="text-blue-500"/>
                  基础信息
               </h3>
               <div className="space-y-3 text-sm">
                  <div><span className="text-gray-500">模型名称:</span> <div className="font-medium mt-0.5">{formData.name}</div></div>
                  <div><span className="text-gray-500">计分方式:</span> <div className="font-medium mt-0.5">{formData.scoringMethod === 'WEIGHTED' ? '加权求和' : '评分累加'}</div></div>
                  <div><span className="text-gray-500">指标数量:</span> <div className="font-medium mt-0.5">{formData.indicators?.length || 0} 个</div></div>
                  <div><span className="text-gray-500">模型描述:</span> <p className="text-gray-600 mt-1 line-clamp-3">{formData.description || '-'}</p></div>
               </div>
            </div>

            {/* Indicator Preview Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col h-[300px]">
               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Icons.BarChart2 size={18} className="text-blue-500"/>
                  指标配置概览
               </h3>
               <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 text-gray-500 sticky top-0">
                        <tr>
                          <th className="p-2 font-medium">指标名称</th>
                          <th className="p-2 font-medium">来源</th>
                          <th className="p-2 font-medium">规则类型</th>
                          <th className="p-2 font-medium text-right">{formData.scoringMethod === 'WEIGHTED' ? '权重' : '满分'}</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {formData.indicators?.map(ind => {
                           const meta = INITIAL_INDICATORS.find(i => i.id === ind.indicatorId);
                           const ruleLabels: Record<string, string> = {
                             'THRESHOLD': '阈值得分',
                             'RATIO': '比率得分',
                             'GRADE_MAP': '等级映射',
                             'DEDUCTION': '容错扣分',
                             'BONUS': '附加分',
                           };
                           return (
                             <tr key={ind.indicatorId}>
                                <td className="p-2 truncate max-w-[150px]" title={meta?.name}>{meta?.name}</td>
                                <td className="p-2 text-gray-500 text-xs">{meta?.source === DataSource.MANUAL ? '人工' : '系统'}</td>
                                <td className="p-2 text-gray-600 text-xs">
                                   {meta?.source === DataSource.MANUAL ? '人工评分' : (ruleLabels[ind.ruleType || ''] || '-')}
                                </td>
                                <td className="p-2 text-right font-mono">
                                   {formData.scoringMethod === 'WEIGHTED' ? `${ind.weight}%` : ind.maxScore}
                                </td>
                             </tr>
                           )
                        })}
                        {(!formData.indicators || formData.indicators.length === 0) && (
                          <tr><td colSpan={4} className="p-4 text-center text-gray-400">暂无配置指标</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* 2. Grade Settings (Optional) */}
         <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-shrink-0">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
               <div>
                  <h3 className="font-bold text-gray-800">等级评价设置 (可选)</h3>
                  <p className="text-xs text-gray-500">是否开启等级划分 (如: 优秀、良好)。若关闭，则仅展示最终得分。</p>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-sm font-medium text-gray-700">{formData.enableGradeLevels ? '已开启' : '已关闭'}</span>
                 <button 
                   onClick={() => setFormData({...formData, enableGradeLevels: !formData.enableGradeLevels})}
                   className={`
                     relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                     ${formData.enableGradeLevels ? 'bg-blue-600' : 'bg-gray-300'}
                   `}
                 >
                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.enableGradeLevels ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
               </div>
            </div>

            {formData.enableGradeLevels && (
              <div className="p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">设置分值区间对应的评价等级</span>
                  <button onClick={addGradeLevel} className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                    <Icons.Plus size={14}/> 添加等级
                  </button>
                </div>
                <div className="space-y-3">
                  {gradeLevels.map((level, index) => (
                    <div key={level.id} className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white border border-gray-200 text-xs text-gray-500 font-bold">{index + 1}</div>
                        <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3">
                              <input type="text" value={level.name} onChange={(e) => updateGradeLevel(level.id, 'name', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="等级名称" />
                          </div>
                          <div className="col-span-5 flex items-center gap-2">
                             <input type="number" value={level.minScore} onChange={(e) => updateGradeLevel(level.id, 'minScore', parseFloat(e.target.value))} className="w-20 border rounded px-2 py-1 text-sm" />
                             <span className="text-gray-400">~</span>
                             <input type="number" value={level.maxScore} onChange={(e) => updateGradeLevel(level.id, 'maxScore', parseFloat(e.target.value))} className="w-20 border rounded px-2 py-1 text-sm" />
                             <span className="text-gray-500 text-sm">分</span>
                          </div>
                          <div className="col-span-2">
                              <input type="color" value={level.color} onChange={(e) => updateGradeLevel(level.id, 'color', e.target.value)} className="w-full h-8 border rounded cursor-pointer" />
                          </div>
                          <div className="col-span-2 text-right">
                              <button onClick={() => removeGradeLevel(level.id)} className="text-gray-400 hover:text-red-500"><Icons.Trash2 size={16}/></button>
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
         </div>
      </div>
    );
  };

  // --- Main List View ---
  const renderListView = () => (
    <div className="h-full flex flex-col p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">评价模型管理</h2>
        <button 
          onClick={handleCreateModel}
          className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Icons.Plus size={18} /> 新建模型
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" ref={dropdownRef}>
        {models.map(model => (
          <div key={model.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative group">
             {/* Top Right Actions */}
             <div className="absolute top-4 right-4 flex items-center gap-1">
                <button 
                  onClick={(e) => handleViewHistory(e, model)}
                  className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors"
                  title="查看历史版本"
                >
                   <Icons.History size={18} />
                </button>
                <div 
                  className="text-gray-400 cursor-pointer hover:text-gray-600 p-1.5 rounded hover:bg-gray-50"
                  onClick={(e) => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === model.id ? null : model.id); }}
                >
                   <Icons.MoreHorizontal size={20} />
                </div>
             </div>
            
            {/* Dropdown Menu */}
            {activeDropdownId === model.id && (
              <div className="absolute top-10 right-4 w-32 bg-white border border-gray-200 shadow-lg rounded-md py-1 z-10 animate-fade-in">
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleCopyModel(model); }}
                   className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                 >
                   <Icons.Copy size={14} /> 复制创建
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id); }}
                   className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                 >
                   <Icons.Trash2 size={14} /> 删除模型
                 </button>
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-4 mt-2">
               <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                 <Icons.Scale size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-gray-800 pr-12 truncate" title={model.name}>{model.name}</h3>
                 <div className="flex items-center gap-2 mt-1">
                    {/* Render tags if they exist, though we cleared specific ones */}
                    {model.tags && model.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{tag}</span>
                    ))}
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{model.version}</span>
                 </div>
               </div>
            </div>
            
            <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">
              {model.description}
            </p>

            <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-50 pt-4 mb-4">
               <div>包含指标数 <span className="text-gray-800 font-medium ml-1">{model.indicators.length} 个</span></div>
               <div>最后更新 <span className="text-gray-800 font-medium ml-1">{model.lastUpdated}</span></div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleEditModel(model)}
                className="flex-1 py-2 border border-gray-200 rounded text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
              >
                配置模型
              </button>
              <button 
                onClick={(e) => handleViewModelDetail(e, model)}
                className="px-4 py-2 border border-gray-200 rounded text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors flex items-center gap-1"
              >
                 <Icons.Search size={14} /> 查看
              </button>
            </div>
          </div>
        ))}
        
        {/* Create New Card Placeholder */}
        <div 
          onClick={handleCreateModel}
          className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer min-h-[250px] transition-colors"
        >
           <Icons.Plus size={32} className="mb-2" />
           <span className="text-sm font-medium">创建一个新模型</span>
        </div>
      </div>

      <HistoryModal 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        model={historyModel} 
        onViewDetail={handleViewHistoryDetail}
      />

      <ModelDetailDrawer
        isOpen={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        model={detailModel}
      />
    </div>
  );

  // --- Main Editor View ---
  const renderEditorView = () => (
    <div className="h-full flex flex-col bg-gray-50">
       {/* Header */}
       <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => setView('list')} className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors">
               <Icons.ArrowLeft size={20} />
             </button>
             <div>
               <h2 className="text-lg font-bold text-gray-800">{currentModel ? '编辑模型' : '新建评价模型'}</h2>
               <p className="text-xs text-gray-400">{formData.name || '未命名模型'}</p>
             </div>
          </div>
          
          {/* Steps */}
          <div className="flex items-center gap-2">
             {['基础信息配置', '指标选择和配置', '配置确认'].map((label, index) => (
               <React.Fragment key={index}>
                 <div className="flex items-center gap-2">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                      ${activeStep === index ? 'bg-blue-600 text-white' : activeStep > index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                    `}>
                      {activeStep > index ? <Icons.Check size={14}/> : index + 1}
                    </div>
                    <span className={`text-sm font-medium ${activeStep === index ? 'text-gray-800' : 'text-gray-500'}`}>
                      {label}
                    </span>
                 </div>
                 {index < 2 && <div className="w-8 h-[1px] bg-gray-300"></div>}
               </React.Fragment>
             ))}
          </div>

          <div className="w-24"></div> {/* Spacer for symmetry */}
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full p-4 overflow-hidden">
             {activeStep === 0 && <StepBasicInfo />}
             {activeStep === 1 && <StepIndicators />}
             {activeStep === 2 && <StepReviewAndSettings />}
          </div>
       </div>

       {/* Footer Actions */}
       <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <button 
            onClick={handlePrevStep}
            disabled={activeStep === 0}
            className="px-6 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一步
          </button>
          
          <button 
            onClick={handleNextStep}
            className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-md transition-colors"
          >
            {activeStep === 2 ? '完成并保存' : '下一步'}
          </button>
       </div>
       
       <ModelDetailDrawer
        isOpen={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        model={detailModel}
      />
    </div>
  );

  return view === 'list' ? renderListView() : renderEditorView();
};