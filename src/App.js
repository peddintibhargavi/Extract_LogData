import React, { useState } from 'react';
import { Table, Card, Upload, Typography, Alert, Space } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Dragger } = Upload;
const { Title } = Typography;

const App = () => {
  const [errorLogs, setErrorLogs] = useState([]);
  const [jsonLogs, setJsonLogs] = useState([]);
  const [base64Images, setBase64Images] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');

  const errorColumns = [
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp' },
    { title: 'Error Type', dataIndex: 'type', key: 'type' },
    { title: 'Details', dataIndex: 'details', key: 'details' },
  ];

  const jsonColumns = [
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp' },
    { title: 'User', dataIndex: 'user', key: 'user' },
    { title: 'Event', dataIndex: 'event', key: 'event' },
    { title: 'Item ID', dataIndex: 'itemId', key: 'itemId' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Price', dataIndex: 'price', key: 'price' },
    { title: 'IP', dataIndex: 'ip', key: 'ip' },
  ];

  // Regular expression to check if a string is Base64 encoded
  const isBase64Encoded = (str) => {
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;
    return base64Regex.test(str);
  };

  const parseLogFile = (content) => {
    try {
      const lines = content.split('\n');
      const newErrorLogs = [];
      const newJsonLogs = [];
      const newBase64Images = [];

      lines.forEach((line) => {
        // Check for Base64 encoded JSON
        if (line.startsWith('BASE64:')) {
          const base64Data = line.replace('BASE64:', '').trim();
          if (isBase64Encoded(base64Data)) {
            try {
              // Decode Base64 and parse JSON
              const decodedData = JSON.parse(atob(base64Data));
              newJsonLogs.push({
                timestamp: decodedData.timestamp,
                user: decodedData.user,
                event: decodedData.event,
                itemId: decodedData.details?.item_id,
                quantity: decodedData.details?.quantity,
                price: decodedData.details?.price,
                ip: decodedData.ip,
              });
            } catch (e) {
              console.log('Failed to decode or parse Base64 JSON:', e);
            }
          }
        }

        // Check for error logs
        if (line.includes('Exception') || line.includes('Error')) {
          const timestamp = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+/)?.[0];
          const errorType = line.match(/([A-Za-z]+Exception|Error[^:])/)?.[0];
          const details = line.replace(timestamp, '').replace(errorType, '').trim();
          if (timestamp && errorType) {
            newErrorLogs.push({ timestamp, type: errorType, details });
          }
        }

        // JSON Logs
        if (line.startsWith('{')) {
          try {
            const jsonData = JSON.parse(line);
            newJsonLogs.push({
              timestamp: jsonData.timestamp,
              user: jsonData.user,
              event: jsonData.event,
              itemId: jsonData.details?.item_id,
              quantity: jsonData.details?.quantity,
              price: jsonData.details?.price,
              ip: jsonData.ip,
            });
          } catch (e) {
            console.log('Failed to parse JSON line:', e);
          }
        }
      });

      setErrorLogs(newErrorLogs);
      setJsonLogs(newJsonLogs);
      setBase64Images(newBase64Images);

      setDebugInfo(`Parsed ${lines.length} lines. Found ${newErrorLogs.length} errors, ${newJsonLogs.length} JSON logs.`);
    } catch (error) {
      setDebugInfo(`Error parsing file: ${error.message}`);
      console.error('Error parsing file:', error);
    }
  };

  const uploadProps = {
    accept: '.log,.txt',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        parseLogFile(content);
      };
      reader.readAsText(file);
      return false;
    },
  };

  // Error logs chart data preparation
  const errorData = errorLogs.reduce((acc, log) => {
    const timestamp = log.timestamp.split('T')[0]; // Group by date
    if (!acc[timestamp]) acc[timestamp] = 0;
    acc[timestamp]++;
    return acc;
  }, {});

  const errorChartData = Object.keys(errorData).map((key) => ({
    date: key,
    count: errorData[key],
  }));

  // Event count by type from JSON logs
  const eventData = jsonLogs.reduce((acc, log) => {
    const eventType = log.event;
    if (!acc[eventType]) acc[eventType] = 0;
    acc[eventType]++;
    return acc;
  }, {});

  const eventChartData = Object.keys(eventData).map((key) => ({
    event: key,
    count: eventData[key],
  }));

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      <Title level={2}>Log File Analyzer</Title>

      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag log file to this area to analyze</p>
      </Dragger>

      {debugInfo && (
        <Alert message="Debug Information" description={debugInfo} type="info" showIcon />
      )}

      {/* Error Logs Table */}
      <Card title="Error Logs" bordered={false}>
        <Table
          dataSource={errorLogs}
          columns={errorColumns}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: 'No error logs found' }}
        />
      </Card>

      {/* Error Log Count Chart */}
      <Card title="Error Log Count by Date" bordered={false}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={errorChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* JSON Logs Table */}
      <Card title="JSON Logs" bordered={false}>
        <Table
          dataSource={jsonLogs}
          columns={jsonColumns}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: 'No JSON logs found' }}
        />
      </Card>

      {/* Event Count by Type Chart */}
      <Card title="Event Count by Type" bordered={false}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={eventChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="event" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {base64Images.length > 0 && (
        <Card title="Base64 Images" bordered={false}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {base64Images.map((imageUrl, index) => (
              <img
                key={index}
                src={imageUrl}
                alt={`Base64 Image ${index}`}
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
              />
            ))}
          </div>
        </Card>
      )}
    </Space>
  );
};

export default App;