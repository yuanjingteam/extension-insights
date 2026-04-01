// 仪表盘组件：负责展示插件分类的饼状图
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

// Let's create types.ts first.
interface ExtensionData {
    id?: string;
    name?: string;
    category?: string;
    // 根据实际使用字段补充其他属性
}

interface Props {
    extensions: ExtensionData[];
}

export const Dashboard: React.FC<Props> = ({ extensions }) => {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const chart = echarts.init(chartRef.current);

        const categoryCounts: Record<string, number> = {};
        // 分类名称翻译
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
            // 使用翻译后的分类名，如果没有翻译则使用原名
            const translatedCat = categoryTranslation[cat] || cat;
            categoryCounts[translatedCat] = (categoryCounts[translatedCat] || 0) + 1;
        });

        const data = Object.keys(categoryCounts).map(key => ({
            name: key,
            value: categoryCounts[key]
        }));

        const option = {
            title: {
                text: '插件分类',
                left: 'center',
                textStyle: {
                    color: '#cccccc'
                }
            },
            tooltip: {
                trigger: 'item'
            },
            series: [
                {
                    name: '分类',
                    type: 'pie',
                    radius: '50%',
                    data: data,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };

        chart.setOption(option);

        const resizeHandler = () => chart.resize();
        window.addEventListener('resize', resizeHandler);

        return () => {
            window.removeEventListener('resize', resizeHandler);
            chart.dispose();
        };
    }, [extensions]);

    return (
        <div style={{ width: '100%', height: '70vh', minHeight: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};
