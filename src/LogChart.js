import React from 'react';
import { Card } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const LogChart = ({ stats }) => {
  const chartData = stats.map(stat => ({
    type: stat._id,
    total: stat.count,
    errors: stat.errorCount
  }));

  return (
    <Card className="mb-4" title="Log Statistics">
      <LineChart width={600} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="type" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Logs" />
        <Line type="monotone" dataKey="errors" stroke="#82ca9d" name="Errors" />
      </LineChart>
    </Card>
  );
};

export default LogChart;