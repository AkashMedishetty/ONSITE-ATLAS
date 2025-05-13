import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Default styling options
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        boxWidth: 10,
        font: {
          size: 12,
        },
      },
    },
  },
};

// Default line chart options
const lineChartOptions = {
  ...defaultOptions,
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

// Default colors for charts
const defaultColors = [
  'rgba(59, 130, 246, 0.6)', // Blue
  'rgba(16, 185, 129, 0.6)', // Green
  'rgba(168, 85, 247, 0.6)', // Purple
  'rgba(249, 115, 22, 0.6)', // Orange
  'rgba(236, 72, 153, 0.6)', // Pink
  'rgba(20, 184, 166, 0.6)', // Teal
  'rgba(245, 158, 11, 0.6)', // Amber
  'rgba(239, 68, 68, 0.6)', // Red
];

// Border colors (darker versions of the fill colors)
const defaultBorderColors = [
  'rgba(59, 130, 246, 1)',
  'rgba(16, 185, 129, 1)',
  'rgba(168, 85, 247, 1)',
  'rgba(249, 115, 22, 1)',
  'rgba(236, 72, 153, 1)',
  'rgba(20, 184, 166, 1)',
  'rgba(245, 158, 11, 1)',
  'rgba(239, 68, 68, 1)',
];

const DashboardChart = ({ 
  type = 'line', 
  data, 
  options = {}, 
  height = 300,
  colors = defaultColors,
  borderColors = defaultBorderColors,
}) => {
  // Process chart data based on type
  const processChartData = () => {
    if (!data) {
      return {
        labels: [],
        datasets: [],
      };
    }

    switch (type) {
      case 'line':
      case 'bar':
        return {
          labels: data.labels || [],
          datasets: data.datasets?.map((dataset, index) => ({
            label: dataset.label,
            data: dataset.data,
            backgroundColor: dataset.backgroundColor || colors[index % colors.length],
            borderColor: dataset.borderColor || borderColors[index % borderColors.length],
            borderWidth: 1,
            tension: type === 'line' ? 0.4 : undefined, // Smoother lines
            ...dataset,
          })) || [],
        };

      case 'pie':
      case 'doughnut':
        return {
          labels: data.labels || [],
          datasets: [{
            data: data.values || [],
            backgroundColor: data.colors || colors,
            borderColor: data.borderColors || borderColors,
            borderWidth: 1,
            ...data.dataset,
          }],
        };

      default:
        return data;
    }
  };

  // Merge options based on chart type
  const chartOptions = () => {
    switch (type) {
      case 'line':
        return { ...lineChartOptions, ...options };
      case 'bar':
        return { ...defaultOptions, ...options };
      case 'pie':
      case 'doughnut':
        return { ...defaultOptions, ...options };
      default:
        return { ...defaultOptions, ...options };
    }
  };

  // Render appropriate chart type
  const renderChart = () => {
    const chartData = processChartData();
    const chartOpts = chartOptions();

    switch (type) {
      case 'line':
        return <Line data={chartData} options={chartOpts} height={height} />;
      case 'bar':
        return <Bar data={chartData} options={chartOpts} height={height} />;
      case 'pie':
        return <Pie data={chartData} options={chartOpts} height={height} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOpts} height={height} />;
      default:
        return <div>Unsupported chart type: {type}</div>;
    }
  };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      {renderChart()}
    </div>
  );
};

export default DashboardChart; 