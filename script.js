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
        form.reset();
    }
    
    deleteAsset(name) {
        if (confirm('确定要删除这项资产吗？')) {
            this.assets = this.assets.filter(asset => asset.name !== name);
            this.saveAssets();
            this.renderAssets();
            this.updateBalanceSheet();
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
}

// 初始化应用
const app = new FinanceApp();