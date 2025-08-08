class FinanceApp {
    constructor() {
        this.records = JSON.parse(localStorage.getItem('financeRecords')) || [];
        this.assets = JSON.parse(localStorage.getItem('financeAssets')) || [];
        
        this.categories = {
            income: ['工资', '奖金', '投资收益', '副业收入', '其他收入'],
            expense: ['餐饮', '交通', '住房', '购物', '娱乐', '医疗', '教育', '其他支出']
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupCategoryOptions();
        this.setDefaultDate();
        this.renderRecords();
        this.renderAssets();
        this.updateSummary();
        this.updateBalanceSheet();
        this.renderSankeyChart();
    }
    
    setupEventListeners() {
        // 标签切换
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // 记账表单
        document.getElementById('record-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecord();
        });
        
        // 类型切换
        document.getElementById('type').addEventListener('change', (e) => {
            this.updateCategoryOptions(e.target.value);
        });
        
        // 资产表单
        document.getElementById('asset-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAsset();
        });
    }
    
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }
    
    setupCategoryOptions() {
        this.updateCategoryOptions('income');
    }
    
    updateCategoryOptions(type) {
        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '<option value="">请选择分类</option>';
        
        this.categories[type].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
    
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }
    
    addRecord() {
        const form = document.getElementById('record-form');
        const formData = new FormData(form);
        
        const record = {
            id: Date.now(),
            type: formData.get('type') || document.getElementById('type').value,
            category: formData.get('category') || document.getElementById('category').value,
            amount: parseFloat(formData.get('amount') || document.getElementById('amount').value),
            description: formData.get('description') || document.getElementById('description').value,
            date: formData.get('date') || document.getElementById('date').value
        };
        
        if (!record.category || !record.amount || !record.date) {
            alert('请填写完整信息');
            return;
        }
        
        this.records.push(record);
        this.saveRecords();
        this.renderRecords();
        this.updateSummary();
        form.reset();
        this.setDefaultDate();
        this.updateCategoryOptions('income');
    }
    
    deleteRecord(id) {
        if (confirm('确定要删除这条记录吗？')) {
            this.records = this.records.filter(record => record.id !== id);
            this.saveRecords();
            this.renderRecords();
            this.updateSummary();
        }
    }
    
    addAsset() {
        const form = document.getElementById('asset-form');
        const type = document.getElementById('asset-type').value;
        const name = document.getElementById('asset-name').value;
        const value = parseFloat(document.getElementById('asset-value').value);
        
        if (!name || !value) {
            alert('请填写完整信息');
            return;
        }
        
        const existingAssetIndex = this.assets.findIndex(asset => asset.name === name);
        
        if (existingAssetIndex !== -1) {
            this.assets[existingAssetIndex] = { type, name, value };
        } else {
            this.assets.push({ type, name, value });
        }
        
        this.saveAssets();
        this.renderAssets();
        this.updateBalanceSheet();
        this.renderSankeyChart();
        form.reset();
    }
    
    deleteAsset(name) {
        if (confirm('确定要删除这项资产吗？')) {
            this.assets = this.assets.filter(asset => asset.name !== name);
            this.saveAssets();
            this.renderAssets();
            this.updateBalanceSheet();
            this.renderSankeyChart();
        }
    }
    
    renderRecords() {
        const container = document.getElementById('records-list');
        container.innerHTML = '';
        
        const sortedRecords = [...this.records].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedRecords.forEach(record => {
            const recordElement = document.createElement('div');
            recordElement.className = 'record-item';
            recordElement.innerHTML = `
                <div class="record-details">
                    <div class="record-category">${record.category}</div>
                    <div class="record-description">${record.description || '无描述'}</div>
                    <div class="record-date">${record.date}</div>
                </div>
                <div class="record-amount ${record.type}">
                    ${record.type === 'income' ? '+' : '-'}¥${record.amount.toFixed(2)}
                </div>
                <button class="delete-btn" onclick="app.deleteRecord(${record.id})">删除</button>
            `;
            container.appendChild(recordElement);
        });
    }
    
    renderAssets() {
        const container = document.getElementById('assets-list');
        container.innerHTML = '';
        
        const assetGroups = {
            cash: '现金',
            deposit: '银行存款',
            investment: '投资',
            property: '房产',
            debt: '负债'
        };
        
        Object.keys(assetGroups).forEach(type => {
            const typeAssets = this.assets.filter(asset => asset.type === type);
            if (typeAssets.length > 0) {
                const groupElement = document.createElement('div');
                groupElement.className = 'assets-group';
                groupElement.innerHTML = `<h3>${assetGroups[type]}</h3>`;
                
                typeAssets.forEach(asset => {
                    const assetElement = document.createElement('div');
                    assetElement.className = 'asset-item';
                    assetElement.innerHTML = `
                        <div class="asset-details">
                            <div class="asset-name">${asset.name}</div>
                            <div class="asset-type">${assetGroups[asset.type]}</div>
                        </div>
                        <div class="asset-amount ${asset.type === 'debt' ? 'expense' : 'income'}">
                            ¥${asset.value.toFixed(2)}
                        </div>
                        <button class="delete-btn" onclick="app.deleteAsset('${asset.name}')">删除</button>
                    `;
                    groupElement.appendChild(assetElement);
                });
                
                container.appendChild(groupElement);
            }
        });
    }
    
    updateSummary() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyRecords = this.records.filter(record => 
            record.date.startsWith(currentMonth)
        );
        
        const monthlyIncome = monthlyRecords
            .filter(record => record.type === 'income')
            .reduce((sum, record) => sum + record.amount, 0);
            
        const monthlyExpense = monthlyRecords
            .filter(record => record.type === 'expense')
            .reduce((sum, record) => sum + record.amount, 0);
            
        const monthlyNet = monthlyIncome - monthlyExpense;
        
        document.getElementById('monthly-income').textContent = `¥${monthlyIncome.toFixed(2)}`;
        document.getElementById('monthly-expense').textContent = `¥${monthlyExpense.toFixed(2)}`;
        document.getElementById('monthly-net').textContent = `¥${monthlyNet.toFixed(2)}`;
        document.getElementById('monthly-net').className = monthlyNet >= 0 ? 'income' : 'expense';
    }
    
    updateBalanceSheet() {
        const totalAssets = this.assets
            .filter(asset => asset.type !== 'debt')
            .reduce((sum, asset) => sum + asset.value, 0);
            
        const totalDebt = this.assets
            .filter(asset => asset.type === 'debt')
            .reduce((sum, asset) => sum + asset.value, 0);
            
        const netWorth = totalAssets - totalDebt;
        
        document.getElementById('total-assets').textContent = `¥${totalAssets.toFixed(2)}`;
        document.getElementById('total-debt').textContent = `¥${totalDebt.toFixed(2)}`;
        document.getElementById('net-worth').textContent = `¥${netWorth.toFixed(2)}`;
        document.getElementById('net-worth').className = netWorth >= 0 ? 'income' : 'expense';
    }
    
    saveRecords() {
        localStorage.setItem('financeRecords', JSON.stringify(this.records));
    }
    
    saveAssets() {
        localStorage.setItem('financeAssets', JSON.stringify(this.assets));
    }
    
    renderSankeyChart() {
        if (typeof d3 === 'undefined' || typeof d3.sankey === 'undefined') {
            console.warn('D3.js 或 d3-sankey 未加载');
            return;
        }
        
        const sankeyData = this.prepareSankeyData();
        if (!sankeyData.nodes.length || !sankeyData.links.length) {
            this.clearSankeyChart();
            return;
        }
        
        const svg = d3.select('#sankey-svg');
        svg.selectAll('*').remove();
        
        const container = document.getElementById('sankey-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        const sankey = d3.sankey()
            .nodeWidth(20)
            .nodePadding(20)
            .extent([[margin.left, margin.top], [chartWidth, chartHeight]]);
        
        const { nodes, links } = sankey(sankeyData);
        
        const g = svg.append('g');
        
        // 使用节点自带的颜色
        const getNodeColor = (node) => {
            return node.color || '#9E9E9E';
        };
        
        // 绘制连接线
        g.append('g')
            .selectAll('.sankey-link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'sankey-link')
            .attr('d', d3.sankeyLinkHorizontal())
            .attr('stroke', d => getNodeColor(d.source))
            .attr('stroke-width', d => Math.max(1, d.width))
            .on('mouseover', (event, d) => {
                this.showTooltip(event, `${d.source.name} → ${d.target.name}: ¥${d.value.toFixed(2)}`);
            })
            .on('mouseout', () => {
                this.hideTooltip();
            });
        
        // 绘制节点
        const node = g.append('g')
            .selectAll('.sankey-node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'sankey-node');
        
        node.append('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('height', d => d.y1 - d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', d => getNodeColor(d))
            .on('mouseover', (event, d) => {
                this.showTooltip(event, `${d.name}: ¥${d.value.toFixed(2)}`);
            })
            .on('mouseout', () => {
                this.hideTooltip();
            });
        
        node.append('text')
            .attr('x', d => d.x0 < chartWidth / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr('y', d => (d.y1 + d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', d => d.x0 < chartWidth / 2 ? 'start' : 'end')
            .text(d => d.name);
        
        this.renderSankeyLegend();
    }
    
    prepareSankeyData() {
        const nodes = [];
        const links = [];
        
        // 资产大类分类（参考专业资产配置）
        const assetCategories = {
            cash: { name: '现金资产', category: '现金资产', color: '#81C784' },
            deposit: { name: '银行存款', category: '银行存款', color: '#64B5F6' },
            investment: { name: '投资资产', category: '投资资产', color: '#FFB74D' },
            property: { name: '不动产', category: '不动产', color: '#A1887F' },
            debt: { name: '负债', category: '负债', color: '#E57373' }
        };
        
        // 添加总资产节点（左侧起点）
        const totalAssetsNode = {
            name: '家庭总资产',
            category: '总资产',
            value: 0,
            color: '#9C27B0'
        };
        
        // 计算总资产价值
        const totalAssetValue = this.assets
            .filter(asset => asset.type !== 'debt')
            .reduce((sum, asset) => sum + asset.value, 0);
        
        const totalDebtValue = this.assets
            .filter(asset => asset.type === 'debt')
            .reduce((sum, asset) => sum + asset.value, 0);
        
        totalAssetsNode.value = totalAssetValue;
        nodes.push(totalAssetsNode);
        
        // 添加资产大类节点（中间分类层）
        const categoryNodes = new Map();
        Object.values(assetCategories).forEach(cat => {
            categoryNodes.set(cat.name, {
                name: cat.name,
                category: cat.category,
                value: 0,
                color: cat.color
            });
        });
        
        // 处理具体资产项目（右侧明细）
        this.assets.forEach(asset => {
            const assetCategory = assetCategories[asset.type];
            if (assetCategory) {
                // 添加具体资产节点
                nodes.push({
                    name: asset.name,
                    category: `${assetCategory.category}明细`,
                    value: asset.value,
                    color: assetCategory.color,
                    assetType: asset.type
                });
                
                // 更新分类节点的值
                const categoryNode = categoryNodes.get(assetCategory.name);
                categoryNode.value += asset.value;
            }
        });
        
        // 添加非零的分类节点
        categoryNodes.forEach(node => {
            if (node.value > 0) {
                nodes.push(node);
            }
        });
        
        // 添加净资产节点（最终结果）
        const netWorthNode = {
            name: '净资产',
            category: '净资产',
            value: totalAssetValue - totalDebtValue,
            color: totalAssetValue - totalDebtValue >= 0 ? '#4CAF50' : '#F44336'
        };
        nodes.push(netWorthNode);
        
        // 创建连接关系
        const nodeNameToIndex = new Map();
        nodes.forEach((node, index) => {
            nodeNameToIndex.set(node.name, index);
        });
        
        // 1. 总资产到各大类的连接
        categoryNodes.forEach((categoryNode, categoryName) => {
            if (categoryNode.value > 0 && categoryNode.category !== '负债') {
                const totalIndex = nodeNameToIndex.get('家庭总资产');
                const categoryIndex = nodeNameToIndex.get(categoryName);
                
                if (totalIndex !== undefined && categoryIndex !== undefined) {
                    links.push({
                        source: totalIndex,
                        target: categoryIndex,
                        value: categoryNode.value
                    });
                }
            }
        });
        
        // 2. 各大类到具体资产项目的连接
        this.assets.forEach(asset => {
            const assetCategory = assetCategories[asset.type];
            if (assetCategory && asset.type !== 'debt') {
                const categoryIndex = nodeNameToIndex.get(assetCategory.name);
                const assetIndex = nodeNameToIndex.get(asset.name);
                
                if (categoryIndex !== undefined && assetIndex !== undefined) {
                    links.push({
                        source: categoryIndex,
                        target: assetIndex,
                        value: asset.value
                    });
                }
            }
        });
        
        // 3. 处理负债（直接影响净资产）
        this.assets.forEach(asset => {
            if (asset.type === 'debt') {
                const assetIndex = nodeNameToIndex.get(asset.name);
                const netWorthIndex = nodeNameToIndex.get('净资产');
                
                if (assetIndex !== undefined && netWorthIndex !== undefined) {
                    links.push({
                        source: assetIndex,
                        target: netWorthIndex,
                        value: asset.value
                    });
                }
            }
        });
        
        // 4. 各资产类别汇总到净资产
        categoryNodes.forEach((categoryNode, categoryName) => {
            if (categoryNode.value > 0 && categoryNode.category !== '负债') {
                // 找到该类别下的所有具体资产，从这些资产连接到净资产
                this.assets
                    .filter(asset => assetCategories[asset.type]?.name === categoryName)
                    .forEach(asset => {
                        const assetIndex = nodeNameToIndex.get(asset.name);
                        const netWorthIndex = nodeNameToIndex.get('净资产');
                        
                        if (assetIndex !== undefined && netWorthIndex !== undefined) {
                            links.push({
                                source: assetIndex,
                                target: netWorthIndex,
                                value: asset.value
                            });
                        }
                    });
            }
        });
        
        return { nodes, links };
    }
    
    renderSankeyLegend() {
        const container = document.querySelector('.sankey-chart');
        let legend = container.querySelector('.sankey-legend');
        
        if (!legend) {
            legend = document.createElement('div');
            legend.className = 'sankey-legend';
            container.appendChild(legend);
        }
        
        const legendData = [
            { name: '总资产', color: '#9C27B0' },
            { name: '现金资产', color: '#81C784' },
            { name: '银行存款', color: '#64B5F6' },
            { name: '投资资产', color: '#FFB74D' },
            { name: '不动产', color: '#A1887F' },
            { name: '负债', color: '#E57373' }
        ];
        
        legend.innerHTML = legendData.map(item => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${item.color}"></div>
                <span>${item.name}</span>
            </div>
        `).join('');
    }
    
    clearSankeyChart() {
        const svg = d3.select('#sankey-svg');
        svg.selectAll('*').remove();
        
        const container = document.querySelector('.sankey-chart');
        const legend = container.querySelector('.sankey-legend');
        if (legend) {
            legend.remove();
        }
        
        // 显示提示信息
        svg.append('text')
            .attr('x', '50%')
            .attr('y', '50%')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('fill', '#666')
            .style('font-size', '16px')
            .text('请先添加资产数据');
    }
    
    showTooltip(event, text) {
        let tooltip = document.querySelector('.sankey-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'sankey-tooltip';
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = text;
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
        tooltip.style.opacity = '1';
    }
    
    hideTooltip() {
        const tooltip = document.querySelector('.sankey-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
        }
    }
}

// 初始化应用
const app = new FinanceApp();