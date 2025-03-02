import { LineChart } from '@mui/x-charts/LineChart';
import { AlertCircle } from 'lucide-react';
import styled from 'styled-components';

const StyledChartContainer = styled.div`
  .MuiLineElement-root {
    stroke-width: 2;
  }
  .MuiMarkElement-root {
    stroke: #1f2937;
    stroke-width: 2;
    fill: #4ade80;
  }
  .MuiChartsAxis-line {
    stroke: #404040;
  }
  .MuiChartsAxis-tick {
    stroke: #404040;
  }
  .MuiChartsAxis-label {
    fill: #e5e7eb !important;
    font-size: 12px;
    font-weight: 500;
  }
  .MuiAreaElement-root {
    fill: url(#areaGradient);
    opacity: 0.3;
  }
  .MuiChartsAxis-tickLabel {
    fill: #e5e7eb !important;
    font-size: 11px;
    font-weight: 500;
  }
  text {
    fill: #e5e7eb !important;
  }
  .MuiChartsAxis-gridLine {
    stroke: #404040;
  }
  /* More specific selectors to ensure styles are applied */
  & .MuiLineChart-root text, 
  & .MuiLineChart-root .MuiChartsAxis-tickLabel,
  & .MuiLineChart-root .MuiChartsAxis-label {
    fill: #e5e7eb !important;
  }
`;

// Utility function to format hour for display
const formatHour = (hour) => {
  return `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? 'am' : 'pm'}`;
};

const CompletionGraph = ({ completionData }) => {
  // Transform data for MUI Charts
  const chartData = completionData.map(item => ({
    hour: item.hour,
    count: item.count
  }));

  const hasData = !completionData.every(item => item.count === 0);

  if (!hasData) {
    return (
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-neutral-400">Subtasks completed by hour</p>
        </div>
        <div className="relative h-64 flex items-center justify-center bg-neutral-800/50 rounded-lg">
          <div className="text-center">
            <AlertCircle className="w-6 h-6 text-neutral-500 mb-2 mx-auto" />
            <p className="text-sm text-neutral-400">No completion data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-neutral-400">Subtasks completed by hour</p>
      </div>
      <div className="relative h-64 bg-neutral-800/50 rounded-lg">
        <StyledChartContainer>
          <LineChart
            series={[
              {
                data: chartData.map(d => d.count),
                area: true,
                color: '#4ade80',
                showMark: true,
                valueFormatter: (value) => `${value} tasks`,
              }
            ]}
            xAxis={[{
              data: chartData.map(d => d.hour),
              valueFormatter: (value) => formatHour(value),
              scaleType: 'point',
              tickLabelStyle: {
                fill: '#e5e7eb',
                fontSize: 11,
                fontWeight: 500
              },
              labelStyle: {
                fill: '#e5e7eb',
                fontSize: 12,
                fontWeight: 500
              }
            }]}
            height={256}
            margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
            slotProps={{
              legend: {
                hidden: true
              },
              svg: {
                style: {
                  "& text": {
                    fill: "#e5e7eb"
                  }
                }
              }
            }}
            sx={{
              '& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-label, & text': {
                fill: '#e5e7eb !important'
              }
            }}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(74, 222, 128)" stopOpacity="1" />
                <stop offset="100%" stopColor="rgb(74, 222, 128)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </LineChart>
        </StyledChartContainer>
      </div>
    </div>
  );
};

export default CompletionGraph; 