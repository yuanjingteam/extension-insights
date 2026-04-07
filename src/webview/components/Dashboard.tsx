// 仪表盘组件：负责展示插件分类的饼状图
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ExtensionData {
    id?: string;
    name?: string;
    category?: string;
    size?: number;
}

interface Props {
    extensions: ExtensionData[];
}

export const Dashboard: React.FC<Props> = ({ extensions }) => {
    const pieChartRef = useRef<HTMLDivElement>(null);
    const barChartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!pieChartRef.current || !barChartRef.current) return;

        const pieChart = echarts.init(pieChartRef.current);
        const barChart = echarts.init(barChartRef.current);

        const categoryCounts: Record<string, number> = {};
        const categoryTranslation: Record<string, string> = {
            'Programming Languages': '编程语言',
            'Linters': '代码检查',
            'Formatters': '代码格式化',
            'Debuggers': '调试器',
            'Snippets': '代码片段',
            'Themes': '主题',
            'Other': '其他',
            'Machine Learning': '机器学习',
            'Testing': '测试',
            'SCM': '版本控制',
            'Remote Development': '远程开发',
            'Education': '教育',
            'Data Science': '数据科学'
        };

        extensions.forEach(ext => {
            const cat = ext.category || 'Other';
            const translatedCat = categoryTranslation[cat] || cat;
            categoryCounts[translatedCat] = (categoryCounts[translatedCat] || 0) + 1;
        });

        let pieData = Object.keys(categoryCounts).map(key => ({
            name: key,
            value: categoryCounts[key]
        }));

        pieData.sort((a, b) => b.value - a.value);
        const MAX_CATEGORIES = 5;
        if (pieData.length > MAX_CATEGORIES) {
            const mainData = pieData.slice(0, MAX_CATEGORIES);
            const otherData = pieData.slice(MAX_CATEGORIES);
            const otherCount = otherData.reduce((sum, item) => sum + item.value, 0);
            pieData = [...mainData, { name: '其他', value: otherCount }];
        }

        const pieOption = {
            title: {
                text: '插件分类占比',
                left: 'center',
                top: 20,
                textStyle: { color: '#E0E0E0', fontSize: 16, fontWeight: 500 }
            },
            tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
            series: [{
                name: '分类',
                type: 'pie',
                radius: ['40%', '70%'], // 环形图更现代
                avoidLabelOverlap: true,
                itemStyle: { borderRadius: 8, borderColor: '#1e1e1e', borderWidth: 2 },
                label: { show: true, color: '#ccc', formatter: '{b}' },
                data: pieData
            }]
        };

        const sortedBySize = [...extensions]
            .filter(ext => ext.size && ext.size > 0)
            .sort((a, b) => (b.size || 0) - (a.size || 0))
            .slice(0, 10)
            .reverse(); 

        const barDataNames = sortedBySize.map(ext => ext.name || ext.id || 'Unknown');
        const barDataValues = sortedBySize.map(ext => parseFloat(((ext.size || 0) / 1024 / 1024).toFixed(2)));

        const barOption = {
            title: {
                text: 'Top 10 空间占用 (MB)',
                left: 'center',
                top: 20,
                textStyle: { color: '#E0E0E0', fontSize: 16, fontWeight: 500 }
            },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value', axisLabel: { color: '#888' }, splitLine: { lineStyle: { color: '#333' } } },
            yAxis: { type: 'category', data: barDataNames, axisLabel: { color: '#ccc', fontSize: 11 } },
            series: [{
                name: '大小',
                type: 'bar',
                data: barDataValues,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                        { offset: 0, color: '#36cfc9' },
                        { offset: 1, color: '#13c2c2' }
                    ]),
                    borderRadius: [0, 4, 4, 0]
                },
                label: { show: true, position: 'right', color: '#aaa', formatter: '{c} MB' }
            }]
        };

        pieChart.setOption(pieOption);
        barChart.setOption(barOption);

        const resizeHandler = () => {
            pieChart.resize();
            barChart.resize();
        };
        window.addEventListener('resize', resizeHandler);

        return () => {
            window.removeEventListener('resize', resizeHandler);
            pieChart.dispose();
            barChart.dispose();
        };
    }, [extensions]);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px', 
            padding: '20px',
            background: '#1e1e1e',
            minHeight: '100vh'
        }}>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
                gap: '20px',
                height: '500px'
            }}>
                <div style={{ background: '#252526', borderRadius: '8px', padding: '10px' }}>
                    <div ref={pieChartRef} style={{ width: '100%', height: '100%' }} />
                </div>
                <div style={{ background: '#252526', borderRadius: '8px', padding: '10px' }}>
                    <div ref={barChartRef} style={{ width: '100%', height: '100%' }} />
                </div>
            </div>
        </div>
    );
};

